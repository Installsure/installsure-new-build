from redis import Redis
from rq import Queue
from src.core.config import settings

redis_conn = Redis.from_url(settings.redis_url)
queue = Queue("bim", connection=redis_conn)


def enqueue_qto_job(file_id: int) -> str:
    """Enqueue QTO processing job"""
    job = queue.enqueue("bim.src.jobs.qto_from_ifc.qto_from_ifc", file_id)
    return job.id


def enqueue_auto_takeoff_job(project_id: int, file_id: int) -> str:
    """Enqueue auto-takeoff job"""
    job = queue.enqueue("bim.src.jobs.auto_takeoff.run_auto_takeoff", project_id, file_id)
    return job.id
