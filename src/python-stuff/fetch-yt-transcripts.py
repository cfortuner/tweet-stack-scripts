# from youtube_transcript_api import YouTubeTranscriptApi

# YouTubeTranscriptApi.get_transcript(video_id)


from __future__ import unicode_literals
import yt_dlp as yt

ydl_opts = {
    'nodownload': True,
    'writesubs': True,
    'writeautosubs': True,
    'writethumbnail': True,
    'downloadsections': True,
    'splitchapters': True,
}
with yt.YoutubeDL(ydl_opts) as ydl:
    ydl.download(['https://www.youtube.com/watch?v=4KfuQwB5rIs'])
