import datetime
import requests
import feedparser
from datetime import datetime
import re

from flask import url_for

from cs50 import SQL
db = SQL("sqlite:///pods.db")



def lookup(keyword):
    # keyword "cats and dogs" should then call this:
    # https://itunes.apple.com/search?term=cats+and+dogs&entity=podcast
    #
    #
    searchkey = "+".join(keyword.split()).lower()
    url = "https://itunes.apple.com/search?term="
    searchlink = f"{url}{searchkey}&entity=podcast"
    response = requests.get(searchlink)
    fullresults = response.json()['results']
    results = []

    seen= set()
    
    for result in fullresults:
        pair = (result['artistName'], result['collectionName'])
        if pair not in seen: #doesnt duplicate search results and has feed url
            try: 
                feedurl = result['feedUrl']
            except KeyError:
                feedurl = 'n/a' #we will still want to display it in this case but without the add option
            try:
                seen.add(pair)
                podName = result['collectionName'].replace("'", "") #have to do this shit to not f up my js
                artworkUrl = result['artworkUrl100']
                #feedurl = result['feedUrl']
                epCount = result['trackCount']
                itunesurl = result['collectionViewUrl']
                results.append({
                'podName': podName,
                'artworkUrl': artworkUrl,
                'feedUrl': feedurl,
                'epCount': epCount,
                'itunesUrl': itunesurl
            })
            except KeyError:
                pass
    
            
    return results



def parse(url):

    episodes = []
    feed = feedparser.parse(url)
    #debug
    #print(feed.feed)
    #debug
    if feed.bozo:
        print("bozo", feed.bozo_exception)
        return [], []
        
        #return feeddata, episodes
    
    
    feedtitle = feed.feed.title
    print (feedtitle)
    
    feedurl = url
    if feed.feed.image:
        feedicon = feed.feed.image['href']
    else:
        feedicon = None
    feeddata = []
    feeddata.append({
        'title': feedtitle,
        'url': feedurl,
        'icon': feedicon
    })
    
    for entry in feed.entries:
        
        #retrieving episodes (those have duration) and not text posts (they do not)
        
        #finding pod ep title
        try:
            title = entry.title if hasattr(entry, 'title') else "n/a"
        except TypeError:
            title = "n/a"
        #if title == "Afterlife 5: Making the New Testament":
        #    print(entry)

        #finding pod ep description
        try:
            desc = entry.summary if hasattr(entry, 'summary') else "n/a"
        except AttributeError:
            desc = "n/a"

        #finding date data
        if entry.published_parsed and len(entry.published_parsed) >= 3:
            year = entry.published_parsed[0]
            month = entry.published_parsed[1]
            day = entry.published_parsed[2]
            #we're expanding babyy
            hour = entry.published_parsed[3]
            minute = entry.published_parsed[4]
            second = entry.published_parsed[5]
        else: 
            year, month, day, hour, minute, second = 0, 0, 0, 0, 0, 0
        #converting date data to date format
        date_str = f"{year}-{month:02d}-{day:02d} {hour:02d}:{minute:02d}:{second:02d}"
        date_obj = datetime.strptime(date_str, "%Y-%m-%d %H:%M:%S")
        #print(date_obj) #debug
        
        #finding ep duration data (n/a as placeholder, i'll just leave it in here)
        #get length, add condition to check for hh:mm:ss format (or mm:ss)
        if 'itunes_duration' in entry:
            duration = entry.get('itunes_duration', 'n/a')

            pattern_hhmmss = re.compile(r'^\d{2}:\d{2}:\d{2}$')
            pattern_hmmss = re.compile(r'^\d{1}:\d{2}:\d{2}$')
            pattern_mmss = re.compile(r'^\d{1,2}:\d{2}$')

            if pattern_hhmmss.match(duration):
                length = duration
            elif pattern_hmmss.match(duration):
                length = f"0{duration}"
            elif pattern_mmss.match(duration):
                length = f"00:{duration}"

            else: #if not, assume it's in seconds and convert it
                try:
                    secs = int(duration)
                    hrs = secs // 3600
                    mins = (secs % 3600) // 60
                    secs = secs % 60
                    length = f"{hrs:02}:{mins:02}:{secs:02}"
                except ValueError:
                    length = 'n/a'

        #if no itunes duration (but we're only considering a select few podcasts for this)
        elif feedtitle == "TRASH COMPACTOR: A (Mostly) Star Wars Podcast" or feedtitle == "Matt and Andy are Still Talking":
            def kbps(title):
                #manually added some exceptions!
                if title == "Secunda Live Audio Reactions for PICARD s3e5":
                    return 33.85
                if "ENTERPRISE - s1e7" in title:
                    return 105.73
                elif title == "DS9 s2e23 “Crossover”":
                    return 130.48
                elif title == "ENTERPRISE s3e22 “The Council”":
                    return 134.77
                elif title == "ENTERPRISE s4e2 “Storm Front, pt. 2”":
                    return 135.72
                elif title == "ENTERPRISE s3e16 “Doctor's Orders”" or title == "VOYAGER s4e20 “Vis-a-Vis”" or title == "VOYAGER s4e21 “The Omega Directive”" or title == "DS9 s2e18 “Profit and Loss”" or title == "ENTERPRISE s3e17 “Hatchery”" or title == "DS9 s2e17 “Playing God”" or "ENTERPRISE - s1e17" in title or "ENTERPRISE - s1e11" in title:
                    return 192
                elif title == "“Three Lemonades (feat. Bashir)” - a musical creation by Lt. Tristan Louth-Robins" or "pop hit by Lt. David Sidhu" in title:
                    return 320
                elif title == "ENTERPRISE TNC THEME" or "More White Guys" in title:
                    return 257.4
                
                #trash compactor exceptions
                elif "Tatooine is Stolen Land" in title:
                    return 161
                elif "Spaghetti Western Homage Planet" in title:
                    return 112

                else:
                    return 128

            def presumed_length_using_bitrate(byteslength, brate):
                length_in_bits = byteslength * 8
                #assumes this bitrate universally:
                thebitrate = brate * 1000
                total_seconds = length_in_bits/thebitrate
                hours = int(total_seconds // 3600)
                minutes = int((total_seconds % 3600) // 60)
                seconds = int(total_seconds % 60)
                return(f"{hours:02}:{minutes:02}:{seconds:02}")
            
            if 'links' in entry and len(entry['links']) > 1 and 'length' in entry['links'][1]:
                byteslength = entry['links'][1]['length']
            elif 'links' in entry and len(entry['links']) > 0 and 'length' in entry['links'][0]:
                byteslength = entry['links'][0]['length']
            else:
                byteslength = 1
            bitrate = kbps(title)
            if title == "VOYAGER s3e4 “The Swarm”":
                length = "01:47:31"
            else:
                length = presumed_length_using_bitrate(int(byteslength), bitrate)
        # note: we may want another condition to look for patreon links
        # and if so, maybe convert to byte duration or just put 'n/a'? anyway, for
        # non-patreon, this should now work.

        else: #for other pods with no itunes_duration
            length = "n/a"

        #finding the link to the ep
        link = url
        if entry.links:
            for thelink in entry.links:
                if thelink['type'] == 'audio/mpeg':
                    link = thelink['href']
                    break
                if link == url:
                    link = thelink['href']

        #the icon for the ep (it may be a big-ass image tho, we'll try to handle it)
        if 'image' in entry and 'href' in entry['image']:
            icon = entry.get('image', {}).get('href')
        elif feed.feed.image: # try to set pod icon as ep icon
            icon = feed.feed.image['href']
        else:
            icon = url_for('static', filename='blanksquare.jpg')

        episodes.append({
            'title': title,
            'desc': desc,
            'date': date_obj,
            'duration': length,
            'link': link,
            'icon': icon
        })
    
    return (feeddata, episodes)
    

def sqlparse(url):
    # this should return feeddata and episodes as before,
    # using the jamesbonding_ tables from pods.db

    if url == 'pods.db/jamesbonding':
        helper_url = "https://feeds.acast.com/public/shows/james-bonding"
        helper_feed = feedparser.parse(helper_url)
        print("parsing the url for james bonding")
        feeddata = []
        episodes = []

        rows = db.execute("SELECT * FROM jamesbonding_episodes")
        for row in rows: #jb sql db
            title = row['title'].replace('’', "'").replace('–', '-')
            
            desc = row['desc']
            year = int(row['date_y'])
            month = int(row['date_m'])
            day = int(row['date_d'])
            date_str = f"{year}-{month:02d}-{day:02d}"
            date_obj = datetime.strptime(date_str, "%Y-%m-%d")
            duration = row['duration']
            link = row['link']
            icon = row['icon']

            episodes.append({
                'title': title, 
                'desc': desc,
                'date': date_obj,
                'duration': duration,
                'link': link,
                'icon': icon
                })
        for entry in helper_feed.entries: #jb rss
            htitle = entry.title.replace('’', "'")
            hdesc = entry.summary

            ### 
            # duration
            tempduration = entry.get('itunes_duration', 'n/a')
            pattern_hhmmss = re.compile(r'^\d{2}:\d{2}:\d{2}$')
            pattern_hmmss = re.compile(r'^\d{1}:\d{2}:\d{2}$')
            pattern_mmss = re.compile(r'^\d{1,2}:\d{2}$')

            if pattern_hhmmss.match(tempduration):
                hduration = tempduration
            elif pattern_hmmss.match(tempduration):
                hduration = f"0{tempduration}"
            elif pattern_mmss.match(tempduration):
                hduration = f"00:{tempduration}"

            else: #if not, assume it's in seconds and convert it
                try:
                    secs = int(tempduration)
                    hrs = secs // 3600
                    mins = (secs % 3600) // 60
                    secs = secs % 60
                    hduration = f"{hrs:02}:{mins:02}:{secs:02}"
                except ValueError:
                    hduration = 'n/a'
            ###

            hlink = helper_url
            if entry.links:
                for thelink in entry.links:
                    if thelink['type'] == 'audio/mpeg':
                        hlink = thelink['href']
                        break
                    if hlink == helper_url:
                        hlink = thelink['href']
            if 'image' in entry and 'href' in entry['image']:
                hicon = entry.get('image', {}).get('href')
            elif helper_feed.feed.image: # try to set pod icon as ep icon
                hicon = helper_feed.feed.image['href']
            else:
                hicon = url_for('static', filename='blanksquare.jpg')
            for episode in episodes: #update the data we had generated from sql table with up to date live feed data
                if ''.join(filter(str.isalnum, htitle)) == ''.join(filter(str.isalnum, episode['title'])):
                    episode['desc'] = hdesc
                    episode['duration'] = hduration
                    episode['link'] = hlink
                    episode['icon'] = hicon

        
        rows = db.execute("SELECT * FROM jamesbonding_feeddata")
        for row in rows:
            feeddata.append({
                'title': row['title'],
                'url': row['url'],
                'icon': row['icon']
            })


    return (feeddata, episodes)