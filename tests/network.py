"""
Description
    Accessing external resources could be potentially dangerous

"""

import urllib.request
contents = urllib.request.urlopen("https://emkc.org").read()