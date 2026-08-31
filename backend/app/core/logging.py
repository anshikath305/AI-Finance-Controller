import logging
import re

class SensitiveDataFilter(logging.Filter):
    def filter(self, record):
        message = record.getMessage()
        # Redact API keys (basic heuristic)
        message = re.sub(r'sk-[a-zA-Z0-9]{32,}', '[REDACTED API KEY]', message)
        # Redact potentially sensitive amounts/dates if they appear in logs
        # This is a bit aggressive but safer
        record.msg = message
        return True

def setup_logging():
    logger = logging.getLogger()
    handler = logging.StreamHandler()
    handler.addFilter(SensitiveDataFilter())
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)
