import os
import time
from rq import Worker, Queue, Connection
from redis import Redis

redis = Redis.from_url(os.getenv("REDIS_URL", "redis://redis:6379/0"))
listen = ["default", "bim", "embeddings", "drone"]

if __name__ == "__main__":
    with Connection(redis):
        worker = Worker(list(map(Queue, listen)))
        worker.work(with_scheduler=True)
