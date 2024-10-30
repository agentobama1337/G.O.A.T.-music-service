import time
from functools import wraps


def trim_song(song):
    try:
        c = len([i for i in song['streamingData']["adaptiveFormats"] if 'video' in i['mimeType']])
        song['streamingData']["adaptiveFormats"] = song['streamingData']["adaptiveFormats"][c::]
        for i in ['playabilityStatus', 'microformat']:
            song.pop(i)
    except:
        pass
    return song


def get_unique(l, param):
    seen = set()
    for d in l:
        i = d[param]
        if i not in seen:
            seen.add(i)
        else:
            l.reverse()
            l.remove(d)
            l.reverse()
    return l


def timed(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        start = time.time()

        result = f(*args, **kwargs)

        end = time.time()

        print(f.__qualname__)
        print(end - start)

        return result

    return wrapper
