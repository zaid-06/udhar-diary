from dotenv import load_dotenv
import os

# Load .env file and override existing environment variables
load_dotenv(override=True)


class Settings:
    GOOGLE_API_KEY: str = os.environ["GOOGLE_API_KEY"]


settings = Settings()