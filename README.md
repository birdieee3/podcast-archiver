# birdieee's pod archiver
#### Video Demo:  <URL HERE>

## Description: What it does

_birdieee's pod archiver_ is a Flask app via which the user may select one or multiple podcast feeds, either by using the search function and adding to the selection from the results, or by manually entering a valid RSS link, including non-public RSS links. The added podcasts are displayed (with accompanying buttons via which the user may remove any podcast feed they have added), and all episodes of the selected podcast feeds are displayed in an HTML table. The entire selection can be cleared at once by pressing _clear session_ at the top.

The data displayed for each episode row is the episode's **icon**, **title**, **episode summary** (accessed by clicking on the title), **date published**, **duration**, as well as a button via which to embed the episode's **audio** (if possible to do so; if not, you'll simply see a link to the episode). The user may sort the table by date (by default, the table is sorted by latest date). The user may also search the table by keyword(s), which dynamically displays only the episodes whose title and/or summary contains said keyword(s).

The user may also download this retrieved data as a .csv file, allowing them to "archive" podcast episode data. The generated .csv does _not_ include, as of this iteration, the links to the audio nor image. The columns I include upon generating the .csv are: **podcast title**, **episode title**, **date published**, and **duration**.

### An extra feature:

There is an additional feature which allows the user to add one specific podcast feed via inputting 'pods.db/jamesbonding' in the manual _add by RSS link_ input box. I have implemented this niche feature to be able to display _James Bonding_ episodes with their original release dates, rather than fetching the dates from the RSS feed, as this publicly available feed is a re-release of the back catalogue. Future versions may see this concept expanded beyond this one podcast, but in its current state, it's at least a proof of concept.

### Additional styling:

The footer contains a link to a separate page, which displays some meta info about the site.

I note there, among other things, that I have used:
* Bootstrap to style the page, 
* Canva to create the site icons, 
* the iTunes Search API to implement the search function.

## The code in detail

The rest of this README elaborates on each section of the code.

I used the [CS50 Duck Debugger](https://cs50.ai/) extensively to guide me, and I also used ChatGPT for a select few sections, which I shall credit specifically whenever relevant below.

## app.py

Set up the app to use local sessions and to use filesystem.

### index ('/')

This fetches a list of any _added_ podcasts from the session and passes it on to _index.html_.

### clear_session

This clears the session (upon the user pressing the _clear session_ button in the header) and redirects back to _index_.

### search

Via POST, this fetches the keyword(s) the user has inputted and removes any non-alphanumeric characters. It then fetches search results by passing the keyword(s) to **lookup** (a _helpers_ function). It returns a jsonified dictionary of the first 49 search results.

### add

The purpose of this function is to _add_ a podcast feed, that is, to pass information about the podcast as well as about all of its episodes on to the JavaScript function responsible for displaying this on the page, as well as to add this information to the user's session.

Via POST, this fetches the RSS url the user has submitted via one of the _Add_ buttons and performs checks to ensure the url's validity and to prevent the user from adding a duplicate.

It then tries to retrieve the podcast info as well as the episode data by calling **parse** (a _helpers_ function), catching errors if any.

It then appends the session data to include the retrieved data and returns a jsonified dictionary containing the same.

### remove

The purpose of this function is the inverse of _add_.

Via POST, this fetches the RSS url the user has submitted via clicking one of the _remove_ buttons, performs checks to ensure that this is possible.

It then updates the user's session to remove this podcast's data and returns a success message.

### download_csv

This generates a .csv using the user's current session data (which contains the podcasts currently selected by the user and their episodes).

Its return statement initializes a download of the csv file.

### credits

This renders credits.html.

### add_from_sql

This implements the niche feature wherein _add_ is implemented by fetching tables from pods.db containing some data about the podcast _James Bonding_, as well as by parsing the existing _James Bonding_ RSS feed.

Via POST, the "url" which is simply a custom key made to work with this function, is fetched.

As in _add_, a check is performed to ensure that the user is not trying to add a duplicate.

It then fetches the pod and episodes data by calling **sqlparse** (a _helpers_ function).

It then appends the session with the retrieved data and returns a jsonified dictionary with the same.

## helpers.py

First, I set it up to use **pods.db** as the SQL database.

### lookup

The purpose of this function is to return search results, each containing information about a podcast.

It crafts a searchkey from the keyword(s) it has received as input.

It then crafts a valid search link as per the [iTunes Search API documentation](https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/index.html) and gets the results.

It iterates over the results, omitting duplicates, and appends to the results dictionary the following:
* podcast title,
* artwork url (which will be used to display an icon),
* the RSS url,
* episode count,
* itunes url

Finally, it returns the dictionary.

### parse

The purpose of this function is to parse the RSS feed and return two dictionaries.

It uses feedparser to parse the input url.

It finds and appends to the _feeddata_ dictionary the following (while catching any errors and taking care of unexpected results):
* the title of the feed,
* the url it received as input,
* artwork url

It then iterates over the feed entries and finds and appends to the _episodes_ dictionary the following:
* episode title

And takes care of any error or exception
* episode summary or description,

And takes care of any error or exception
* date published

Manually formats the date by first retrieving each date component seperately and combining the variables in a uniform format.
* duration

First, it tries to retrieve itunes_duration and manually format it in the hh:mm:ss format if it doesn't already comply.

If itunes_duration is not found, it is assumed that the duration variable, if any, will be in bytelength. To convert it to seconds, the bitrate must be known (or assumed). To avoid inacurracies, I decided to only perform this conversion for two specific podcasts. Why? One of them was fast to implement, while the other, because of my niche interest, I care about retrieving accurate data for.

Thus, assuming by default a bitrate of 128 kbps, and manually adding exceptions episode-by-episode (in the **kbps** function), I implement a function **presumed_length_using_bitrate** which performs the conversion to hh:mm:ss with reasonable accuracy.

For other exceptions with no available itunes_duration, I assign the duration to be 'n/a'.

Likewise appended to the _episodes_ dictionary is:

* the link to the audio,
* the link to the episode icon

The two dictionaries are then returned.

### sqlparse

The purpose of this function is to parse the James Bonding (re-air) feed if 'pods.db/jamesbonding' was submited by the user, as well as "parse" the SQL tables containing the original publishing dates of James Bonding episodes, combining the two sets of data.

It retrieves relevant data from the SQL tables and appends to the _episodes_ dictionary.

It then retrieves the RSS feed and parses it as **parse** would have, and then alters the _episodes_ dictionary entries by adding summary, duration, audio link, artwork icon using the data from the parsed feed.

(In the process, some additional string transformation has to be done because of unintended characters in my SQL data, and some minor differences in the way that titles are formatted between my data and the RSS data.)

It returns, as **parse** does, the two dictionaries.

## junk.py and junk2.py and james_bonding_episodes_original_dates.csv

I used these to generate rows for the jamesbonding_episodes and jamesbonding_feeddata tables using data from a premade csv. This python code was executed only once and (along with the .csv) is no longer necessary for the app, but I have chosen to keep it in this folder for documentation purposes.

## pods.db

The purpose of this database is to support the niche feature pertaining to the podcast _James Bonding_.

The data of note contained in the jamesbonding_episodes and jamesbonding_feeddata tables are the episode titles and upload dates, as well as the artwork icon and feed name for display. These tables are then used in **add_from_sql** and **sqlparse** (_app.py_ and _helpers.py_ functions, respectively).

## script.js

The bulk of the code is written in JavaScript. This was necessary to implement the dynamic functionality I envisioned for this project. I wanted to implement the main features of this app (displaying relevant content) without page refresh, however, having very little experience with JavaScript, I employed the help of ChatGPT to write some of the functions. All of ChatGPTs suggestions had to be adjusted and debugged, but I shall credit it specifically below whenever relevant.

### search

The purpose of this function is to display search results.

It fetches the submitted search keyword and passes it on to the '/search' route.

It fetches the '/search' response.

It sets up parameters for the pagination buttons so that a maximum of 7 search results are displayed on each pagination page (***ChatGPT was used to help with this part***).

For each search result, it displays the following:
* an image with the podcast feed artwork
* the iTunes title of the podcast
* an _Add_ button which submits the RSS url of the feed to addPod (if RSS link is available)
* the episode count of the podcast
* a button which allows the user to follow the RSS url directly (if RSS link is available)
* a button which allows the user to visit the iTunes page of the podcast directly

These elements are then nested in a resultElement div.

It then creates pagination buttons (***ChatGPT was used to help with this part***).

Finally, it calls **updateClearButton**.

### clear search

When search results are displayed, a _clear search_ button is also displayed. Upon clicking it, the search results and the user's search keywords are cleared. I am not sure whether the Duck Debugger or ChatGPT helped me with this, but it was one of them.

The updateClearButton function hides or unhides the _clear_ button based on whether or not there are search results.

The clearSearch function clears the search, the pagination buttons, and the input field and calls the above function.

### addedPodsOrNone

This function checks if there any pods are currently aded, and, accordingly, either displays the addedResults element or the noAddedResults element which contains text instructions. Further, it hides or unhides the _download .csv_ button.

### addPod

***ChatGPT was used to write parts of this function***.

This function displays added podcast feeds as card elements, and adds their episodes to the HTML table.

#### Duplicate check

First, a check is performed to prevent the user from adding a duplicate. Ironically, this function duplicates the functionality of a similar check in the app.py function. Thus, in fact, this check may be removed from the JS code. 

The difference between the JS check and the app.py check is that the JS check catches the duplicate if the page has not been refreshed since adding the original. The addedFeeds set is cleared upon refresh, but the session is not, and, as explained later, the added pods are repopulated upon refresh via the onload function. Thus, in the current code, any duplicate add attempts after the refresh are caught instead by app.py.

Although I admit this redundancy in the design, it is not huge and the duplicate checking works, thus I have elected to keep it in if only for documentation purposes.

#### The flask function fetched

To support the niche feature whereby the user may add a podcast via 'pods.db/jamesbonding', I fetch the corresponding flask function '/add_from_sql' in that specific case. Otherwise, the submitted url is passed to '/add'.

#### Displaying the podcast card

A card 'div' is created and appended to the HTML, containing the following:
* podcast icon
* podcast title
* a 'remove' button, displayed as an 'X', which submits the feed url to the removePod function

#### Displaying the table of episodes

If episodes are found, the function iterates over each episode and adds a row to the table, containing the following:
* episode icon. If there is no episode icon, it displays the podcast icon instead. There is a (possibly now redundant) check from previous iterations which displays the name of the feed if there is no proper icon to display. The image loads lazily.
* episode title. The title text is clickable, which reveals the shownotes (episode description) for that particular episode (a Bootstrap thing, which I adapted and modified). To display only the correct description upon click, uniue ids are assigned to each description element.
* date published. A uniform date format is ensured.
* duration.
* a _play_ button. Upon click, this embeds the audio for this episode. Sometimes there is no audio to embed, in which case a simple link to the episode is generated here instead.

Finally, the addedPodsOrNone function is called, as well as the sortTableByDate function to automatically sort the table by latest date whenever new episodes have been displayed.


### addByLink

***ChatGPT was used to help with this function***

Passes the RSS link inputted by the user to the addPod function.

Before it does so, it performs client-side checks to prevent invalid urls from being passed.

### removePod

The purpose of this function is to remove a podcast from selection along with the episodes pertaining to that podcast.

It passes the RSS url submitted via the _remove_ button to '/remove' (which removes it from the user's session). 

Upon success, it removes the corresponding podcast card from the HTML and the corresponding rows from the table.

It then calls addedPodsOrNone to update the HTML further if necessary.

### sorting the table automatically and manually (by date)

***ChatGPT was used to help with this function***

These functions sort the episodes table by date, either ascending or descending, making sure that the date variable is parsed correctly.

Event listeners are added to the HTML sorting buttons to call the sortTableByDate function as appropriate.

### search by episode title (and shownotes)

This function watches the _search by title_ input field and dynamically displays the episode rows whose title or description contains the input keyword(s).

Originally, before my implementation of the _description_ elements, this function only searched the _title_ elements. Later, because of the way in which I added the descriptions, those were queried as well by this function. Thus more rows are displayed via this search than intended.

However, I decided to keep it this way, because this additional functionality may be useful. I considered the following: Perhaps the keyword via which the user wishes to find a particular episode is not contained in the title, but is only found in the shownotes. In that case, this feature will still find the episode.

### onload

The purpose of this onload function is to display any and all podcast data stored in the user's session, so that upon page refresh, the added pods and the episode table contents are repopulated.

Thus this function duplicates most of the addPod function's _Displaying the podcast card_ and _Displaying the table of episodes_ functionality, changing the function variables whenever necessary.

Likewise, it calls sortTableByDate and addedPodsOrNone.

## styles.scss

Because this app uses Bootstrap for styling, a Sass file was necessary to alter some of Bootstrap's variables. The file is then compiled into styles.css. The file is thoroughly commented to make clear which elements are being custom-styled. 

I have borrowed some navbar css from the CS50 Finance problem set.

## layout.html

Template for layout.html borrowed from CS50 Finance problem set.

Added _clear session_ button to navbar.

## index.html

Extends layout.html.

Contains a (visually hidden) data container for JS retrieval purposes.

Contains search container with search and manual add forms.

Contains a div where the added podcasts will be displayed and an alternate div containing brief instructions if no podcasts have been added.

Contains the headers for the table of episodes and the download button which fetches the _download_ function in app.py.

## credits.html

Extends layout.html.

This is a credits page where some meta info about the site/app is displayed.

## /static images

Custom made site logos, as well as an iTunes logo and an RSS logo for some search result buttons.

## Known uncaught errors

Although I painstakingly catch a variety of errors and exceptions, there are a few errors which persist:

* A small minority of podcast episodes still display an imprecise duration.
* A small minority of podcast feeds are not parsed correctly upon addding. The error is usually caught even in these cases, but the alert displayed may not accurately reflect what the issue was.