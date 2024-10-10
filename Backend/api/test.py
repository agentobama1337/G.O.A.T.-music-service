from ytmusicapi import YTMusic

import json

yt = YTMusic(location="US", language="en")

# home = yt.get_home(20)[1::]

# response = str(response).replace("\'","\"").replace("True","true").replace("False","false").replace("None","null")
#
# print(response)
#


# for i in home:
#     print(i['title'])
#     if i['title'] == "Albums for you":
#         print(i)
#
# print(home)

search = yt.search("never gonna give you up")

song = yt.get_song(search[0]["videoId"])

print(song)

home = yt.get_home()

print(home)




