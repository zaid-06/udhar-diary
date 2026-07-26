import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Camera, ImageUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getErrorMessage } from "@/lib/get-error-message";
import { extractInventorySlip } from "../api";

type InventoryImageCaptureProps = {
  businessId: string | null;
  onSuccess?: () => void | Promise<void>;
};

export function InventoryImageCapture({
  businessId,
  onSuccess,
}: InventoryImageCaptureProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

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

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    if (!cameraOpen) {
      stopCamera();
      return;
    }

    let cancelled = false;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch {
        setCameraOpen(false);
      }
    };

    void startCamera();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [cameraOpen]);

  const openVerifyDialog = (dataUrl: string) => {
    setPendingImage(dataUrl);
    setVerifyOpen(true);
  };

  const closeVerifyDialog = () => {
    setVerifyOpen(false);
    setPendingImage(null);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        openVerifyDialog(reader.result);
      }
    };
    reader.readAsDataURL(file);
    setMenuOpen(false);
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
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, width, height);
    openVerifyDialog(canvas.toDataURL("image/jpeg", 0.92));
    setCameraOpen(false);
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
      closeVerifyDialog();
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not submit image"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div ref={menuRef} className="relative">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Add product image"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <Camera />
        </Button>

        {menuOpen ? (
          <div className="absolute right-0 top-[calc(100%+8px)] z-40 min-w-[220px] rounded-xl border border-border/60 bg-card p-1.5 shadow-lg">
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
              onClick={() => {
                setMenuOpen(false);
                setCameraOpen(true);
              }}
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

      <Dialog open={cameraOpen} onOpenChange={setCameraOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Take a photo</DialogTitle>
          </DialogHeader>
          <div className="overflow-hidden rounded-lg border border-border/60 bg-black">
            <video
              ref={videoRef}
              className="aspect-video w-full object-cover"
              playsInline
              muted
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCameraOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={capturePhoto}>
              Capture
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={verifyOpen}
        onOpenChange={(open) => {
          if (!open) closeVerifyDialog();
        }}
      >
        <DialogContent
          className="fixed inset-0 top-0 left-0 z-50 flex h-dvh w-dvw max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-0 p-0 ring-0 sm:max-w-none"
          showCloseButton
        >
          <DialogHeader className="shrink-0 border-b border-border/60 px-4 py-3">
            <DialogTitle>Verify image</DialogTitle>
          </DialogHeader>
          {pendingImage ? (
            <div className="flex min-h-0 flex-1 items-center justify-center bg-muted/20 p-4">
              <img
                src={pendingImage}
                alt="Preview for verification"
                className="max-h-full max-w-full object-contain"
              />
            </div>
          ) : (
            <div className="min-h-0 flex-1" />
          )}
          <DialogFooter className="shrink-0 justify-center border-t border-border/60 bg-background px-4 py-4 sm:justify-center">
            <Button
              type="button"
              size="lg"
              className="min-w-[160px]"
              disabled={!pendingImage || submitting}
              onClick={() => void handleSubmit()}
            >
              {submitting ? "Submitting…" : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
