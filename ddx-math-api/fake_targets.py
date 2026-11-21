import os
import time


def echo(payload):
    return payload


def sleep_forever(payload):
    time.sleep(60)


def sleep_briefly(payload):
    time.sleep(payload["seconds"])
    return {"slept": payload["seconds"]}


def crash(payload):
    os._exit(1)


def allocate(payload):
    return len(bytearray(payload["bytes"]))