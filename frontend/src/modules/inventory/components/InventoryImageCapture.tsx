import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type TouchEvent as ReactTouchEvent,
} from "react";
import {
  Aperture,
  Camera,
  ImageUp,
  Loader2,
  RefreshCw,
  RotateCcw,
  Send,
  Sparkles,
  X,
  ZapOff,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/get-error-message";
import { extractInventorySlip } from "../api";

type InventoryImageCaptureProps = {
  businessId: string | null;
  onSuccess?: () => void | Promise<void>;
};

type ScannerMode = "camera" | "preview";

type ScanGuide = {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
} | null;

type ZoomCapability = {
  min?: number;
  max?: number;
  step?: number;
};

type CameraTrackCapabilities = MediaTrackCapabilities & {
  zoom?: ZoomCapability;
};

type CameraTrackConstraintSet = MediaTrackConstraintSet & {
  zoom?: number;
};

type OpenCvLike = {
  Mat: new (...args: unknown[]) => {
    delete: () => void;
    rows?: number;
    cols?: number;
    data32S?: Int32Array;
  };
  MatVector: new () => {
    delete: () => void;
    size: () => number;
    get: (index: number) => {
      delete: () => void;
      rows?: number;
      data32S?: Int32Array;
    };
  };
  Size: new (width: number, height: number) => unknown;
  Rect: new (x: number, y: number, width: number, height: number) => unknown;
  RETR_EXTERNAL: number;
  CHAIN_APPROX_SIMPLE: number;
  COLOR_RGBA2GRAY: number;
  CV_8UC4: number;
  matFromImageData: (imageData: ImageData) => { delete: () => void };
  cvtColor: (src: unknown, dst: unknown, code: number) => void;
  GaussianBlur: (
    src: unknown,
    dst: unknown,
    ksize: unknown,
    sigmaX: number,
  ) => void;
  Canny: (
    image: unknown,
    edges: unknown,
    threshold1: number,
    threshold2: number,
  ) => void;
  findContours: (
    image: unknown,
    contours: unknown,
    hierarchy: unknown,
    mode: number,
    method: number,
  ) => void;
  boundingRect: (contour: unknown) => {
    x: number;
    y: number;
    width: number;
    height: number;
  };
};

declare global {
  interface Window {
    cv?: OpenCvLike;
  }
}

const VIDEO_CONSTRAINTS: MediaStreamConstraints = {
  video: {
    facingMode: { ideal: "environment" },
    width: { ideal: 1920 },
    height: { ideal: 1080 },
  },
  audio: false,
};

const DEFAULT_ZOOM = 1;
const MAX_ZOOM_FALLBACK = 3;

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

function getFriendlyCameraError(error: unknown) {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError" || error.name === "SecurityError") {
      return "Camera permission was denied. Allow camera access and try again.";
    }
    if (
      error.name === "NotFoundError" ||
      error.name === "OverconstrainedError"
    ) {
      return "No camera was found on this device.";
    }
  }

  return "Could not open the camera. Please try again or import a receipt image.";
}

function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;

    const { overflow, overscrollBehavior } = document.body.style;
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";

    return () => {
      document.body.style.overflow = overflow;
      document.body.style.overscrollBehavior = overscrollBehavior;
    };
  }, [locked]);
}

function detectReceiptGuide(video: HTMLVideoElement): ScanGuide {
  const cv = window.cv;
  if (!cv || !video.videoWidth || !video.videoHeight) return null;

  const canvas = document.createElement("canvas");
  const sampleWidth = 360;
  const sampleHeight = Math.round(
    (video.videoHeight / video.videoWidth) * sampleWidth,
  );
  canvas.width = sampleWidth;
  canvas.height = sampleHeight;

  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;

  context.drawImage(video, 0, 0, sampleWidth, sampleHeight);

  const imageData = context.getImageData(0, 0, sampleWidth, sampleHeight);
  const src = cv.matFromImageData(imageData);
  const gray = new cv.Mat();
  const blurred = new cv.Mat();
  const edges = new cv.Mat();
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();

  try {
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
    cv.Canny(blurred, edges, 60, 160);
    cv.findContours(
      edges,
      contours,
      hierarchy,
      cv.RETR_EXTERNAL,
      cv.CHAIN_APPROX_SIMPLE,
    );

    const frameArea = sampleWidth * sampleHeight;
    let bestRect: ScanGuide = null;

    for (let index = 0; index < contours.size(); index += 1) {
      const contour = contours.get(index);
      const rect = cv.boundingRect(contour);
      contour.delete();

      const area = rect.width * rect.height;
      const aspectRatio = rect.width / Math.max(rect.height, 1);
      const isReceiptLike =
        area > frameArea * 0.12 &&
        area < frameArea * 0.86 &&
        aspectRatio > 0.35 &&
        aspectRatio < 1.35;

      if (!isReceiptLike) continue;

      const confidence = area / frameArea;
      if (!bestRect || confidence > bestRect.confidence) {
        bestRect = {
          x: (rect.x / sampleWidth) * 100,
          y: (rect.y / sampleHeight) * 100,
          width: (rect.width / sampleWidth) * 100,
          height: (rect.height / sampleHeight) * 100,
          confidence,
        };
      }
    }

    return bestRect;
  } catch {
    return null;
  } finally {
    src.delete();
    gray.delete();
    blurred.delete();
    edges.delete();
    contours.delete();
    hierarchy.delete();
  }
}

export function InventoryImageCapture({
  businessId,
  onSuccess,
}: InventoryImageCaptureProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerMode, setScannerMode] = useState<ScannerMode>("camera");
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [menuTop, setMenuTop] = useState(0);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [maxZoom, setMaxZoom] = useState(MAX_ZOOM_FALLBACK);
  const [focusPoint, setFocusPoint] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [detectedGuide, setDetectedGuide] = useState<ScanGuide>(null);

  const menuRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pinchDistanceRef = useRef<number | null>(null);
  const zoomStartRef = useRef(DEFAULT_ZOOM);

  const scannerActive = scannerOpen || Boolean(pendingImage);
  useBodyScrollLock(scannerActive);

  const stopCamera = useCallback(() => {
    stopStream(streamRef.current);
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const closeScanner = useCallback(() => {
    stopCamera();
    setScannerOpen(false);
    setScannerMode("camera");
    setPendingImage(null);
    setCameraError(null);
    setCameraLoading(false);
    setDetectedGuide(null);
    setFocusPoint(null);
    setZoom(DEFAULT_ZOOM);
  }, [stopCamera]);

  const openPreview = useCallback(
    (dataUrl: string) => {
      stopCamera();
      setPendingImage(dataUrl);
      setScannerMode("preview");
      setScannerOpen(false);
      setCameraError(null);
      setCameraLoading(false);
      setDetectedGuide(null);
      setMenuOpen(false);
    },
    [stopCamera],
  );

  const openCamera = useCallback(() => {
    setPendingImage(null);
    setScannerOpen(true);
    setScannerMode("camera");
    setCameraError(null);
    setDetectedGuide(null);
    setFocusPoint(null);
    setZoom(DEFAULT_ZOOM);
    setMenuOpen(false);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [menuOpen]);

  useEffect(() => {
    if (!scannerOpen || scannerMode !== "camera") {
      stopCamera();
      return;
    }

    let cancelled = false;

    const startCamera = async () => {
      setCameraLoading(true);
      setCameraError(null);

      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("Camera access is not available in this browser.");
        }

        const stream =
          await navigator.mediaDevices.getUserMedia(VIDEO_CONSTRAINTS);

        if (cancelled) {
          stopStream(stream);
          return;
        }

        streamRef.current = stream;

        const videoTrack = stream.getVideoTracks()[0];
        const capabilities = videoTrack?.getCapabilities?.() as
          | CameraTrackCapabilities
          | undefined;
        const zoomCapability = capabilities?.zoom;
        if (zoomCapability && typeof zoomCapability.max === "number") {
          setMaxZoom(Math.max(zoomCapability.max, DEFAULT_ZOOM));
        } else {
          setMaxZoom(MAX_ZOOM_FALLBACK);
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (error) {
        if (!cancelled) {
          setCameraError(getFriendlyCameraError(error));
          stopCamera();
        }
      } finally {
        if (!cancelled) {
          setCameraLoading(false);
        }
      }
    };

    void startCamera();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [scannerMode, scannerOpen, stopCamera]);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  useEffect(() => {
    if (!scannerOpen || scannerMode !== "camera") return;

    const intervalId = window.setInterval(() => {
      if (videoRef.current?.readyState === HTMLMediaElement.HAVE_ENOUGH_DATA) {
        setDetectedGuide(detectReceiptGuide(videoRef.current));
      }
    }, 900);

    return () => window.clearInterval(intervalId);
  }, [scannerMode, scannerOpen]);

  useEffect(() => {
    const videoTrack = streamRef.current?.getVideoTracks()[0];
    if (!videoTrack?.applyConstraints) return;

    const capabilities = videoTrack.getCapabilities?.() as
      | CameraTrackCapabilities
      | undefined;
    if (!capabilities?.zoom) return;

    void videoTrack.applyConstraints({
      advanced: [{ zoom } as CameraTrackConstraintSet],
    });
  }, [zoom]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        openPreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;

    const width = video.videoWidth;
    const height = video.videoHeight;
    if (!width || !height) return;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.drawImage(video, 0, 0, width, height);
    openPreview(canvas.toDataURL("image/jpeg", 0.92));
  };

  const handleRetake = () => {
    setPendingImage(null);
    openCamera();
  };

  const handleSubmit = async () => {
    if (!pendingImage) return;

    if (!businessId) {
      toast.error("Select a business first");
      return;
    }

    setSubmitting(true);
    try {
      await extractInventorySlip(businessId, pendingImage);
      await onSuccess?.();
      toast.success("Slip extracted and inventory updated");
      closeScanner();
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not submit image"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleTouchStart = (event: ReactTouchEvent<HTMLDivElement>) => {
    if (event.touches.length !== 2) return;

    const [firstTouch, secondTouch] = [event.touches[0], event.touches[1]];
    pinchDistanceRef.current = Math.hypot(
      secondTouch.clientX - firstTouch.clientX,
      secondTouch.clientY - firstTouch.clientY,
    );
    zoomStartRef.current = zoom;
  };

  const handleTouchMove = (event: ReactTouchEvent<HTMLDivElement>) => {
    if (event.touches.length !== 2 || !pinchDistanceRef.current) return;

    event.preventDefault();
    const [firstTouch, secondTouch] = [event.touches[0], event.touches[1]];
    const distance = Math.hypot(
      secondTouch.clientX - firstTouch.clientX,
      secondTouch.clientY - firstTouch.clientY,
    );
    const nextZoom =
      zoomStartRef.current * (distance / Math.max(pinchDistanceRef.current, 1));

    setZoom(Math.min(Math.max(nextZoom, DEFAULT_ZOOM), maxZoom));
  };

  const handleTapToFocus = (event: ReactMouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setFocusPoint({
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
    });

    window.setTimeout(() => setFocusPoint(null), 850);
  };

  const detectedGuideStyle: CSSProperties | undefined = detectedGuide
    ? {
        left: `${detectedGuide.x}%`,
        top: `${detectedGuide.y}%`,
        width: `${detectedGuide.width}%`,
        height: `${detectedGuide.height}%`,
      }
    : undefined;

  return (
    <>
      <style>
        {`
          @keyframes receiptScannerBorder {
            0%, 100% { opacity: 0.72; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.012); }
          }

          @keyframes receiptScannerLine {
            0%, 100% { transform: translateY(-9.5rem); opacity: 0; }
            12%, 88% { opacity: 1; }
            50% { transform: translateY(9.5rem); opacity: 0.95; }
          }
        `}
      </style>

      <div ref={menuRef} className="relative">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Add product image"
          aria-expanded={menuOpen}
          onClick={(event) => {
            setMenuTop(event.currentTarget.getBoundingClientRect().bottom);
            setMenuOpen((open) => !open);
          }}
        >
          <Camera />
        </Button>

        {menuOpen ? (
          <div
            className="fixed left-1/2 top-[var(--inventory-image-menu-top)] z-40 w-[min(calc(100vw-32px),240px)] -translate-x-1/2 rounded-xl border border-border/60 bg-card p-1.5 shadow-lg sm:absolute sm:left-auto sm:right-0 sm:top-[calc(100%+8px)] sm:w-[220px] sm:translate-x-0"
            style={
              {
                "--inventory-image-menu-top": `${menuTop + 8}px`,
              } as CSSProperties & Record<"--inventory-image-menu-top", string>
            }
          >
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-muted/80"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageUp className="size-4 shrink-0 text-muted-foreground" />
              Import from device
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-muted/80"
              onClick={openCamera}
            >
              <Camera className="size-4 shrink-0 text-muted-foreground" />
              Take photo
            </button>
          </div>
        ) : null}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {scannerActive ? (
        <div className="fixed inset-0 z-[9999] h-[100dvh] w-dvw overflow-hidden bg-black text-white">
          {scannerMode === "camera" ? (
            <div className="relative flex h-full w-full animate-in fade-in duration-300">
              <div
                className="absolute inset-0 touch-none"
                onClick={handleTapToFocus}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
              >
                <video
                  ref={videoRef}
                  className="h-full w-full object-cover"
                  style={{ transform: `scale(${zoom})` }}
                  playsInline
                  muted
                  autoPlay
                />

                <div className="pointer-events-none absolute inset-0 bg-black/10" />
                <div className="pointer-events-none absolute inset-x-0 top-0 h-[24dvh] bg-black/55" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[24dvh] bg-black/60" />
                <div className="pointer-events-none absolute left-0 top-[24dvh] h-[52dvh] w-[calc((100vw-min(82vw,420px))/2)] bg-black/55" />
                <div className="pointer-events-none absolute right-0 top-[24dvh] h-[52dvh] w-[calc((100vw-min(82vw,420px))/2)] bg-black/55" />

                <div className="pointer-events-none absolute left-1/2 top-[48%] aspect-[3/4] w-[min(82vw,calc(100dvh-230px)*0.75,420px)] -translate-x-1/2 -translate-y-1/2">
                  <div className="absolute inset-0 rounded-[28px] border border-white/35 shadow-[0_0_0_999px_rgba(0,0,0,0.08)]" />
                  <div className="absolute inset-0 rounded-[28px] border-2 border-cyan-300/80 shadow-[0_0_32px_rgba(103,232,249,0.35)] [animation:receiptScannerBorder_1.8s_ease-in-out_infinite]" />
                  <div className="absolute left-0 top-0 size-12 rounded-tl-[28px] border-l-4 border-t-4 border-white" />
                  <div className="absolute right-0 top-0 size-12 rounded-tr-[28px] border-r-4 border-t-4 border-white" />
                  <div className="absolute bottom-0 left-0 size-12 rounded-bl-[28px] border-b-4 border-l-4 border-white" />
                  <div className="absolute bottom-0 right-0 size-12 rounded-br-[28px] border-b-4 border-r-4 border-white" />
                  <div className="absolute left-4 right-4 top-1/2 h-px bg-cyan-200/80 shadow-[0_0_18px_rgba(103,232,249,0.9)] [animation:receiptScannerLine_2.4s_ease-in-out_infinite]" />
                </div>

                {detectedGuideStyle ? (
                  <div
                    className="pointer-events-none absolute rounded-2xl border-2 border-emerald-300/90 shadow-[0_0_22px_rgba(110,231,183,0.45)] transition-all duration-300"
                    style={detectedGuideStyle}
                  />
                ) : null}

                {focusPoint ? (
                  <div
                    className="pointer-events-none absolute size-16 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full border border-white/90 bg-white/10"
                    style={{
                      left: `${focusPoint.x}%`,
                      top: `${focusPoint.y}%`,
                    }}
                  />
                ) : null}
              </div>

              <div className="pointer-events-none absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-black/75 to-transparent px-4 pb-12 pt-[max(16px,env(safe-area-inset-top))]">
                <div className="pointer-events-auto flex items-center justify-between">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="size-11 rounded-full bg-black/45 text-white hover:bg-white/15 hover:text-white"
                    aria-label="Close camera"
                    onClick={closeScanner}
                  >
                    <X className="size-5" />
                  </Button>

                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      disabled
                      className="size-11 rounded-full bg-black/35 text-white/55 disabled:opacity-60"
                      aria-label="Flash unavailable"
                    >
                      <ZapOff className="size-5" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      disabled
                      className="size-11 rounded-full bg-black/35 text-white/55 disabled:opacity-60"
                      aria-label="Switch camera unavailable"
                    >
                      <RefreshCw className="size-5" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="pointer-events-none absolute inset-x-4 top-[calc(48%-min(82vw,calc(100dvh-230px)*0.75,420px)*0.67)] z-10 flex justify-center">
                <div className="rounded-full bg-black/45 px-4 py-2 text-center text-sm font-medium text-white shadow-lg backdrop-blur">
                  Align your receipt inside the frame
                </div>
              </div>

              {cameraLoading ? (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black">
                  <Loader2 className="size-8 animate-spin text-white" />
                  <p className="text-sm text-white/80">Opening camera...</p>
                </div>
              ) : null}

              {cameraError ? (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-black px-6 text-center">
                  <div className="max-w-sm rounded-2xl bg-white/10 p-5 shadow-2xl backdrop-blur">
                    <Aperture className="mx-auto mb-3 size-8 text-white/80" />
                    <p className="text-base font-medium">{cameraError}</p>
                    <div className="mt-5 flex justify-center gap-3">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={closeScanner}
                      >
                        Close
                      </Button>
                      <Button type="button" onClick={openCamera}>
                        Try again
                      </Button>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/85 to-transparent px-6 pb-[max(72px,env(safe-area-inset-bottom))] pt-20 sm:pb-[max(22px,env(safe-area-inset-bottom))]">
                <div className="pointer-events-auto mx-auto flex max-w-md items-center justify-between">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="size-12 rounded-2xl bg-white/12 text-white hover:bg-white/20 hover:text-white sm:size-14"
                    aria-label="Import receipt from gallery"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImageUp className="size-6" />
                  </Button>

                  <button
                    type="button"
                    className="grid size-18 place-items-center rounded-full border-4 border-white bg-white/20 shadow-[0_0_28px_rgba(255,255,255,0.28)] transition active:scale-95 disabled:opacity-60 sm:size-20"
                    aria-label="Capture receipt"
                    disabled={cameraLoading || Boolean(cameraError)}
                    onClick={capturePhoto}
                  >
                    <span className="size-12 rounded-full bg-white sm:size-14" />
                  </button>

                  <div className="flex size-12 items-center justify-center rounded-2xl bg-white/12 text-xs font-semibold text-white/85 sm:size-14">
                    {zoom.toFixed(1)}x
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative flex h-full w-full animate-in fade-in duration-200">
              {pendingImage ? (
                <img
                  src={pendingImage}
                  alt="Receipt preview"
                  className="h-full w-full object-contain"
                />
              ) : null}

              <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/75 to-transparent px-4 pb-14 pt-[max(16px,env(safe-area-inset-top))]">
                <div className="flex items-center justify-between">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="size-11 rounded-full bg-black/45 text-white hover:bg-white/15 hover:text-white"
                    aria-label="Close preview"
                    disabled={submitting}
                    onClick={closeScanner}
                  >
                    <X className="size-5" />
                  </Button>
                  <div className="flex items-center gap-2 rounded-full bg-black/45 px-4 py-2 text-sm font-medium backdrop-blur">
                    <Sparkles className="size-4 text-cyan-200" />
                    Receipt preview
                  </div>
                </div>
              </div>

              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent px-5 pb-[max(22px,env(safe-area-inset-bottom))] pt-24">
                <div className="mx-auto grid max-w-md grid-cols-2 gap-3">
                  <Button
                    type="button"
                    size="lg"
                    variant="secondary"
                    className="h-14 rounded-full bg-white/14 text-white hover:bg-white/22 hover:text-white"
                    disabled={submitting}
                    onClick={handleRetake}
                  >
                    <RotateCcw className="mr-2 size-5" />
                    Retake
                  </Button>
                  <Button
                    type="button"
                    size="lg"
                    className="h-14 rounded-full"
                    disabled={!pendingImage || submitting}
                    onClick={() => void handleSubmit()}
                  >
                    {submitting ? (
                      <Loader2 className="mr-2 size-5 animate-spin" />
                    ) : (
                      <Send className="mr-2 size-5" />
                    )}
                    {submitting ? "Submitting..." : "Submit"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </>
  );
}
