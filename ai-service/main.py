# def main():
#     print("Hello from ai-service!")


# if __name__ == "__main__":
#     main()

from fastapi import FastAPI
from app.api.routes.invoice import router

app = FastAPI()

app.include_router(router)