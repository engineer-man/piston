"""
Description
    Files can be written into world writable directories without being removed,
    potentially leading to disk space exhaustion

    Run this test twice and there should be no output

"""

import os

directories = [
    "/dev/shm",
    "/run/lock",
    "/tmp",
    "/var/tmp"
]

for dir in directories:
    fpath = f"{dir}/bean"
    if os.path.exists(fpath):
        print(f"{fpath} exists")
    else:
        with open(fpath, "w") as f:
            f.write("beannn")