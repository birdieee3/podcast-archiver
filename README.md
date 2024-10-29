# birdieee's pod archiver
#### Video Demo:  [YouTube](https://www.youtube.com/watch?v=JrnufwtO6XY)

#### Deployed: [pod-archiver.onrender.com](https://pod-archiver.onrender.com) (currently may be slow to load)

## Summary

This is a web app via which the user may search for and add podcasts to selection (the search uses iTunes API) or add manually via RSS link. The episodes from the selected podcasts are then displayed. You may click on the title to view the episode summary, play the audio, and download a .csv of your episodes.

I used a Flask (Python) backend and vanilla JavaScript frontend. This was my first project using JS to this extent, and as such, there are some ineffeciencies I would alleviate.

If I had to do it over again, I would:
- Use a flex layout for consistency and mobile-compatibility. I was just beginning to learn css and it is messy here.
- Be more consistent with my JS methods and variable declarations

## Extended summary
### Description

_birdieee's pod archiver_ is a Flask app via which the user may select one or multiple podcast feeds, either by using the search function and adding to the selection from the results, or by manually entering a valid RSS link, including non-public RSS links. The added podcasts are displayed (with accompanying buttons via which the user may remove any podcast feed they have added), and all episodes of the selected podcast feeds are displayed in an HTML table. The entire selection can be cleared at once by pressing _clear session_ at the top.

The data displayed for each episode row is the episode's **icon**, **title**, **episode summary** (accessed by clicking on the title), **date published**, **duration**, as well as a button via which to embed the episode's **audio** (if possible to do so; if not, you'll simply see a link to the episode). The user may sort the table by date (by default, the table is sorted by latest date). The user may also search the table by keyword(s), which dynamically displays only the episodes whose title and/or summary contains said keyword(s).

The user may also download this retrieved data as a .csv file, allowing them to "archive" podcast episode data. The generated .csv does _not_ include, as of this iteration, the links to the audio nor image. The columns I include upon generating the .csv are: **podcast title**, **episode title**, **date published**, and **duration**.

### An extra feature:

There is an additional feature which allows the user to add one specific podcast feed via inputting 'pods.db/jamesbonding' in the manual _add by RSS link_ input box. I have implemented this niche feature to be able to display _James Bonding_ episodes with their original release dates, rather than fetching the dates from the RSS feed, as this publicly available feed is a re-release of the back catalogue. Future versions may see this concept expanded beyond this one podcast, but in its current state, it's at least a proof of concept.

## How:

I have used:

* Bootstrap to help style the page, 
* Canva to create the site icons, 
* the iTunes Search API to implement the search function.

I used a Flask (Python) backend. 

Although the site is JS-heavy, I made this before knowing anything about JS frameworks (lol).

## Known issues

* Currently not optimized for display on mobile devices.

Although I painstakingly catch a variety of errors and exceptions, there are a few errors which persist:

* A small minority of podcast episodes still display an imprecise duration.
* A small minority of podcast feeds are not parsed correctly upon addding. The error is usually caught even in these cases, but the alert displayed may not accurately reflect what the issue was.
