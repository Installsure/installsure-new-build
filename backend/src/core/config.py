from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    redis_url: str
    jwt_secret: str = "change_me"
    file_storage: str = "local"
    file_storage_base: str = "../uploads"
    factual_requires_retrieval: bool = True

    class Config:
        env_file = ".env"


settings = Settings()  # type: ignore
