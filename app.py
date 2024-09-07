import re
import csv
import io

from flask import jsonify

from cs50 import SQL
from flask import Flask, redirect, render_template, request, session, url_for, Response
from flask_session import Session

    #
#from werkzeug.security import check_password_hash, generate_password_hash
from helpers import lookup, parse, sqlparse
    #

# Configure application
app = Flask(__name__)

    #
# Custom filter
#app.jinja_env.filters["usd"] = usd
    #


app.config["DEBUG"] = True
# Configure session to use filesystem (instead of signed cookies)
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

# Configure CS50 Library to use SQLite database
db = SQL("sqlite:///pods.db")



@app.after_request
def after_request(response):
    """Ensure responses aren't cached"""
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Expires"] = 0
    response.headers["Pragma"] = "no-cache"
    return response



@app.route("/")
def index():
    """show the main page with all the stuffs"""
    # print(session.get('added_pods', []))  # Debugging line
    # print(session['added_pods'])
    added_pods = session.get('added_pods', [])
    return render_template("index.html", added_pods=added_pods)

@app.route('/clear_session')
def clear_session():
    session.clear()
    return redirect(url_for('index'))


@app.route("/search", methods=['POST'])
def search():
    """search for shows using lookup and jsonify results"""
    keyword = re.sub(r'[^A-Za-z0-9 ]+', '', request.json.get('keyword'))
    results = lookup(keyword)

    # Commenting the following because this session info is not used
    #if 'current_search' not in session:
    #    session['current_search'] = []
    #session['current_search'] = keyword
    #if 'search_results' not in session:
    #    session['search_results'] = []
    #session['search_results'] = results[:49]
    #session.modified = True

    return jsonify({'results':results[:49]})

    

@app.route("/add", methods=['POST'])
def add():
    """get the added show's episodes from parser and jsonify"""
    
    #we get the url we are gonna parse
    data = request.get_json()
    url = data.get('feedUrl')
    print(url)  # Debugging line

    if not url:
        return jsonify({"error": "No URL provided"}), 400
    
    if 'added_pods' not in session:
        session['added_pods'] = []

    #not going through with it if it will be a duplicate
    for pod in session['added_pods']:
        if isinstance(pod, dict) and 'feeddata' in pod and isinstance(pod['feeddata'], list):
            if pod['feeddata'][0]['url'] == url:
                return jsonify({"error": "Feed already added"}), 400

    #sending it to the feedparser thing in helpers and handling errors
    try:
        feeddata, episodes = parse(url)
    except Exception as e:
        print(f"Error parsing feed: {e}")  #debugging line
        return jsonify({"error": "Failed to parse the RSS feed"}), 500

    if not episodes or episodes is None:
        return jsonify({"error": "Invalid RSS feed"}), 400

    #updating the session
    session['added_pods'].append({'feeddata': feeddata, 'episodes': episodes})
    session.modified = True

            #(old comment) have to do this shit to avoid special characters messing up my javascript: (actually we did it earlier but i'll leave it in)
            #data['podName'] = re.sub(r'[^A-Za-z0-9 ]+', '', data['podName'])
    return jsonify({'pod': feeddata, 'episodes': episodes})

    


@app.route("/remove", methods=['POST'])
def remove():
    """remove these pod eps from the table and also from our list of added pods"""
    data = request.get_json()
    url = data.get('url')
    print(url) #debugging but I'll keep it.
    
    if not url:
        return jsonify({"error": "No URL provided"}), 400
    #i think this one shouldn't ever happen but still
    if 'added_pods' not in session:
        return jsonify({"error": "No podcasts to remove"}), 400
    
    #im guessing i want to parse again to know which eps to remove?
    # no! 
    # actually, no need.
    
    updated_pods = []
    for pod in session['added_pods']:
        if isinstance(pod, dict) and 'feeddata' in pod:
            if isinstance(pod['feeddata'], list):
                # Handle the case where feeddata is a list of dictionaries
                filtered_feeddata = [fd for fd in pod['feeddata'] if fd.get('url') != url]
                if filtered_feeddata:
                    updated_pods.append({'feeddata': filtered_feeddata, 'episodes': pod.get('episodes', [])})
                else:
                    print(f"Removing pod with URL: {url}")
            else:
                print("Unexpected feeddata structure")
        else:
            print("Unexpected pod structure")
            

    # Update the session with the filtered list
    session['added_pods'] = updated_pods
    session.modified = True
    
    return jsonify({'message': 'Podcast removed successfully'}), 200

@app.route("/download")
def download_csv():
    """download current table of eps as csv"""

    added_pods = session.get('added_pods', [])
    #print(type(added_pods))
    #print(added_pods[0])
    if not added_pods:
        return "No data available"
    
    def generate():

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(['podcast title', 'episode title', 'date published', 'duration'])

        all_episodes = []
        
        for pod in added_pods:
            podtitle = pod['feeddata'][0]['title'] #pod title
            for episode in pod['episodes']:
                title = episode['title'] #ep title
                date = episode['date'] #ep date
                duration = episode['duration'] #ep duration

                all_episodes.append([podtitle, title, date, duration])

        all_episodes.sort(key=lambda x: x[2], reverse=True)  

        for episode in all_episodes:
            writer.writerow(episode)

        yield output.getvalue()
        output.close

    return Response(generate(), mimetype='text/csv', headers={"Content-Disposition": "attachment;filename=podcasts.csv"})



@app.route("/credits")
def credits():
    """show the main page with all the stuffs"""
    
    return render_template("credits.html")




@app.route("/add_from_sql", methods=['POST'])
def add_from_sql():
    """get the jamesbonding episodes and feeddata from sql table and jsonify"""
    #
    #
    #we get the url we are gonna parse
    data = request.get_json()
    url = data.get('feedUrl')
    print(url)  # Debugging line

    if not url:
        return jsonify({"error": "No URL provided"}), 400
    
    if 'added_pods' not in session:
        session['added_pods'] = []

    #not going through with it if it will be a duplicate
    for pod in session['added_pods']:
        if isinstance(pod, dict) and 'feeddata' in pod and isinstance(pod['feeddata'], list):
            if pod['feeddata'][0]['url'] == url:
                return jsonify({"error": "Feed already added"}), 400

    #sending it to the feedparser thing in helpers and handling errors
    try:
        feeddata, episodes = sqlparse(url)
    except Exception as e:
        print(f"Error parsing feed: {e}")  #debugging line
        return jsonify({"error": "Failed to parse the RSS feed"}), 500

    if not episodes or episodes is None:
        return jsonify({"error": "Invalid RSS feed"}), 400

    #updating the session
    session['added_pods'].append({'feeddata': feeddata, 'episodes': episodes})
    session.modified = True

            #(old comment) have to do this shit to avoid special characters messing up my javascript: (actually we did it earlier but i'll leave it in)
            #data['podName'] = re.sub(r'[^A-Za-z0-9 ]+', '', data['podName'])
    return jsonify({'pod': feeddata, 'episodes': episodes})



if __name__ == "__main__":
    app.run(debug=True)
