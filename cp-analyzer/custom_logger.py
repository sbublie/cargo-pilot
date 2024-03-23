import logging
from logging.handlers import RotatingFileHandler

# Create a logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)
handler = RotatingFileHandler('./logs/cp-analyser.log', maxBytes=1024*1024, backupCount=1)
handler.setLevel(logging.DEBUG)
formatter = logging.Formatter('%(asctime)s.%(msecs)03d [%(levelname)s] - %(funcName)30s() -> %(message)s')
formatter.datefmt = '%Y-%m-%d %H:%M:%S'
handler.setFormatter(formatter)
logger.addHandler(handler)