

//search function

var podSearchForm = document.getElementById('podSearch');
if (podSearchForm) {
    podSearchForm.addEventListener('submit', function(event) {
    event.preventDefault();
    //if (event.submitter.id === 'clearButton') {
    //    clearSearch();
    //}
    let keyword = document.getElementById('keyword').value;

    fetch('/search', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ keyword: keyword })
    })
    .then(response => response.json())
    .then(data => {
        //place search results into the HTML
        const results = data.results;
        const resultsPerPage = 7;
        const totalPages = Math.ceil(results.length / resultsPerPage);
        let currentPage = 1;

        let resultsDiv = document.getElementById('searchResults');

        function displayPage(page) {
            resultsDiv.innerHTML = '';
            const start = (page - 1) * resultsPerPage;
            const end = start + resultsPerPage;
            const pageResults = results.slice(start, end);

            pageResults.forEach(result => {
                
                let resultElement = document.createElement('div');
                resultElement.className = 'searchresult-row'

                let feedUrl = result.feedUrl;
                let addButton = `<button class="btn btn-success searchresult-add" onclick="addPod('${feedUrl}')">Add</button>`;
                let rssLink = `<a class="searchresult-url" href='${feedUrl}'>
                                <img src="static/rss-logo.png" class="link-icon">
                            </a>`;

                if (feedUrl === 'n/a') {
                    addButton = `<button class="btn btn-success searchresult-add" disabled>Add</button>`;
                    rssLink = ''; // No RSS link if feedUrl is 'n/a'
                }

                resultElement.innerHTML = `
                    <img src="${result.artworkUrl}" alt="Artwork" class="searchresult-img">
                    <span class="searchresult-name">${result.podName}</span>
                    ${addButton} (${result.epCount} episodes)
                    <a class="searchresult-itunesurl" href='${result.itunesUrl}'>
                        <img src="static/itunes-logo.png" class="link-icon">
                    </a>
                    ${rssLink}`;
                resultsDiv.appendChild(resultElement);
            });
        }
        function createPageButtons() {
            const paginationDiv = document.getElementById('pagination'); // Ensure this element exists in your HTML
            paginationDiv.innerHTML = ''; // Clear previous buttons
            let paginationUl = document.createElement('ul');
            paginationUl.className = 'pagination justify-content-center pagination-sm';
            for (let i = 1; i <= totalPages; i++) {
                let li = document.createElement('li');
                li.className = 'page-item';
                if (i === currentPage) {
                    li.classList.add('active');
                    li.setAttribute('aria-current', 'page')
                }
                let button = document.createElement('button');
                button.textContent = i;
                button.className = 'page-link';
                button.onclick = () => {
                    currentPage = i;
                    displayPage(currentPage);
                    createPageButtons();
                };
                li.appendChild(button)
                paginationUl.appendChild(li);
            }
            paginationDiv.appendChild(paginationUl);
        }

        displayPage(currentPage);
        createPageButtons();
        updateClearButton();
    });
});
}

//clear search

function updateClearButton() {
    const clearButton = document.getElementById('clearButton');
    const clearForm = document.getElementById('clearSearch');
    let resultsDiv = document.getElementById('searchResults');
    if (resultsDiv.innerHTML.trim() === '') {
        clearForm.classList.add('hidden')
    } else {
        clearForm.classList.remove('hidden');
    }
    clearButton.disabled = resultsDiv.innerHTML.trim() === '';
}

function clearSearch() {
    let resultsDiv = document.getElementById('searchResults');
    resultsDiv.innerHTML = '';
    document.getElementById('keyword').value = ''; //clear input field as well
    let paginationDiv = document.getElementById('pagination'); // Target the pagination div
    paginationDiv.innerHTML = ''; // Clear pagination buttons
    updateClearButton();
}
// Attach clearSearch to the form's submit event
var clearSearchForm = document.getElementById('clearSearch');
if (clearSearchForm) {
    clearSearchForm.addEventListener('submit', function(event) {
    event.preventDefault();
    clearSearch();
});
}


//display default text if no pods have been added

function addedPodsOrNone() {
    let addedResults = document.getElementById('addedResults');
    let noAddedResults = document.getElementById('noAddedResults');
    let downloadButtonDiv = document.querySelector('.download-button');

    if (addedResults.childElementCount === 0) {
        noAddedResults.style.display = 'block';
        downloadButtonDiv.style.display = 'none';
    } else {
        noAddedResults.style.display = 'none';
        downloadButtonDiv.style.display = 'block';
    }
}

//add pod
const addedFeeds = new Set();

let descCounter = 0;

function addPod(feedUrl) {

    if(addedFeeds.has(feedUrl)) {
        alert("already added!");
        return;
    }

    let flaskAdd = '/add';
    if (feedUrl === 'pods.db/jamesbonding') {
        flaskAdd = '/add_from_sql';
    }
    
    fetch(flaskAdd, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ feedUrl: feedUrl })
    })
    .then(response => {
        if (response.status === 400) {
            alert("already added!");
            throw new Error("Feed already added");
        }
        return response.json();
    })
    .then(data => {

        addedFeeds.add(feedUrl);
        
        //handling the added pod
        let addedDiv = document.getElementById('addedResults');
        //addedDiv.innerHTML = '';


        let newDiv = document.createElement('div');
        newDiv.className = 'added-pod card w-50 mb-3'; //bs class
        newDiv.dataset.url = feedUrl; // store url in data variable

        let newDeeperDiv = document.createElement('div');
        newDeeperDiv.className = 'card-body';


        let podcastImage = document.createElement('img');
        if (data.pod && data.pod.length > 0) {
            podcastImage.src = data.pod[0].icon || "n/a";
        } else {
            podcastImage.textContent = "n/a";
        }
        podcastImage.className = 'added-pod-icon';
        newDeeperDiv.appendChild(podcastImage);

        let titleContainer = document.createElement('div');
        titleContainer.className = 'text-container';
        let podcastTitle = document.createElement('span');
        if (data.pod && data.pod.length > 0) {
            podcastTitle.textContent = data.pod[0].title || "n/a";
        } else {
            podcastTitle.textContent = "n/a";
        }
        podcastTitle.className = 'added-pod-title';
        titleContainer.appendChild(podcastTitle);
        newDeeperDiv.appendChild(titleContainer);


        let removeButton = document.createElement('button');
        removeButton.textContent = '';
        removeButton.className = 'added-pod-remove-button btn-close' //bs class
        
        removeButton.addEventListener('click', function() {
            removePod(feedUrl);  // Assuming the URL is stored in data.pod[0].url
        });
        newDeeperDiv.appendChild(removeButton);

        newDiv.appendChild(newDeeperDiv);

        

        addedDiv.appendChild(newDiv);

        //let podcastEpCount = document.createElement('span');
        //podcastEpCount.textContent = data.pod.epCount;
        //addedDiv.appendChild(podcastTitle);

        //handling adding the eps
        let tableBody = document.getElementById('resultsTable').getElementsByTagName('tbody')[0];
        
        //for now, clearing previous
        //tableBody.innerHTML = '';
        if (data.episodes) {
            data.episodes.forEach(episode => {
                let rowElement = document.createElement('tr');
                rowElement.dataset.url = feedUrl; // Store URL in data attribute of the row element
    
                //ICON
                // no icon -> display name of the feed instead
                if (episode.icon === '/static/blanksquare.jpg') {
                    let nonImgElement = document.createElement('span');
                    nonImgElement.textContent = data.pod[0].title;
                    nonImgElement.className = 'no-icon-so-just-title';
                    rowElement.appendChild(nonImgElement);
                // yes icon -> display the icon
                } else {
                    let imgElement = document.createElement('img');
                    if (episode.icon) {
                        imgElement.src = episode.icon;
                    } else {
                        imgElement.src = podcastImage.src
                    }
                    imgElement.width = 50;
                    imgElement.height = 50;
                    imgElement.loading = 'lazy';
                    rowElement.appendChild(imgElement);
                }
                
    
                //TITLE
                let titleDescId = `collapsedDesc${descCounter++}`;
                let titleCell = document.createElement('td');
                
                let titleCollapse = document.createElement('a');
                titleCollapse.className = 'title-collapse';
                titleCollapse.setAttribute('data-bs-toggle', 'collapse');
                titleCollapse.setAttribute('href', `#${titleDescId}`);
                titleCollapse.setAttribute('role', 'button');
                titleCollapse.setAttribute('aria-expanded', 'false');
                titleCollapse.setAttribute('aria-controls', titleDescId);
                titleCollapse.textContent = episode.title;

                titleCell.appendChild(titleCollapse);
                titleCell.className = 'title-cell'; // for the search by title event listener (way down below)
                
    

                //desc
                let collapseDiv = document.createElement('div');
                collapseDiv.className = 'collapse';
                collapseDiv.id = titleDescId;

                let cardDiv = document.createElement('div');
                cardDiv.className = 'card card-body desc-body';
                cardDiv.innerHTML = episode.desc; 

                collapseDiv.appendChild(cardDiv);
                titleCell.appendChild(collapseDiv);

                rowElement.appendChild(titleCell);
                //let descCell = document.createElement('td');
                //descCell.textContent = episode.desc;
                //rowElement.appendChild(descCell);
    
                //DATE
                let dateCell = document.createElement('td');
                let date = new Date(episode.date);
                dateCell.textContent = date.toLocaleDateString("fr-FR");
                rowElement.appendChild(dateCell);
    
                //DURATION
                let durationCell = document.createElement('td');
                durationCell.textContent = episode.duration;
                rowElement.appendChild(durationCell);
                
                //EMBEDDED OR LINKED
                let playCell = document.createElement('td');
                //check if can be easily embedded
                let fileExtension = /\.(mp3|wav|ogg)(\?|$)/i;
                //if yes, make button with which we can play the ep
                if (fileExtension.test(episode.link)) {
                    let button = document.createElement('button');
                    button.innerHTML = "&#9655;";
                    button.className = 'btn btn-outline-warning';
                    playCell.appendChild(button);
    
                    button.addEventListener('click', () => {
                        let audioElement = playCell.querySelector('audio');
                        if (audioElement) {
                            // Remove the audio element
                            audioElement.remove();
                        } else {
                            // Create and append audio element
                            audioElement = document.createElement('audio');
                            audioElement.controls = true;
                            audioElement.src = episode.link; // Assuming episode.link contains the audio URL
                            playCell.appendChild(audioElement);
                        }
                    });
                    //if not, create link
                } else {
                    let link = document.createElement('a');
                    link.href = episode.link;
                    link.textContent = "Follow Link";
                    playCell.appendChild(link);
                }
                
                rowElement.appendChild(playCell);
    
    
                tableBody.appendChild(rowElement);
    
                
                
            });
        }
        
        sortTableByDate('desc');
        addedPodsOrNone();
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

//add manually

    //client-side checks before submitting  
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (err) {
        if (string === 'pods.db/jamesbonding') { //we gon try somethin
            return true;
        } else {
            return false;
        }
    }
}
function isLikelyRssLink(url) {
    // Basic checks for common RSS feed URL patterns (e.g., .xml, /rss/)
    const rssPattern = /(xml|rss|feed)/i;
    return rssPattern.test(url);
}

function addByLink(event) {
    event.preventDefault();
    const rssLinkInput = document.getElementById('rssLinkInput').value;
    //not sure at which point should perform check for valid link
    //nvm let's do it now, first we do it in js to do it client-side:
    if(!isValidUrl(rssLinkInput)) {
        alert("Please enter a valid URL");
        return false;
    }
    if(!isLikelyRssLink(rssLinkInput)) {
        const manualSubmitConfirmation = confirm("This doesn't look like an RSS feed link. Try to submit anyway?")
        if (!manualSubmitConfirmation) {
            return false;
        }
    }
    //if seems ok, pass it to addPod 
    addPod(rssLinkInput);
    //clear after submission
    document.getElementById('rssLinkInput').value = '';

    return false;
}
    



//remove pod from list

function removePod(url) {
    // Your logic to handle the removal, e.g., sending a request to the server
    console.log('Removing podcast with URL:', url);

    fetch('/remove', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url: url })
    })
    .then(response => response.json())
    .then(data => {

        addedFeeds.delete(url);
        //remove the general pod info
        let elementsToRemove = document.querySelectorAll(`.added-pod[data-url='${url}']`);
        elementsToRemove.forEach(element => element.remove());
        

        // Remove episodes
        let rowsToRemove = document.querySelectorAll(`tr[data-url='${url}']`);
        rowsToRemove.forEach(row => row.remove());


        console.log('Success:', data);
        // Handle success, e.g., remove the podcast element from the DOM
        //optionally can show a confirmation message also, but we dont have it here
        addedPodsOrNone();
    })
    .catch((error) => {
        console.error('Error:', error);
    });
    
}


//sorting the table


// Add a function to parse date strings in 'dd/mm/yyyy' format
function parseDateString(dateStr) {
    let [day, month, year] = dateStr.split('/').map(num => parseInt(num, 10));
    return new Date(year, month - 1, day); // JavaScript months are 0-based
}

// Function to format date as 'dd/mm/yyyy'
function formatDateString(date) {
    let day = date.getDate();
    let month = date.getMonth() + 1; // Months are zero-based
    let year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// Function to sort the table by date
function sortTableByDate(order = 'asc') {
    let table = document.getElementById('resultsTable');
    let tbody = table.getElementsByTagName('tbody')[0];
    let rows = Array.from(tbody.getElementsByTagName('tr'));

    rows.sort((a, b) => {
        let dateStrA = a.getElementsByTagName('td')[1].textContent.trim(); 
        let dateStrB = b.getElementsByTagName('td')[1].textContent.trim();
        let dateA = parseDateString(dateStrA);
        let dateB = parseDateString(dateStrB);
        return order === 'asc' ? dateA - dateB : dateB - dateA;
    });

    tbody.innerHTML = '';
    rows.forEach(row => {
        let dateCell = row.getElementsByTagName('td')[1];
        let dateStr = dateCell.textContent.trim();
        let date = parseDateString(dateStr);
        dateCell.textContent = formatDateString(date); // Update date format
        tbody.appendChild(row);
    });
}


// Attach event listeners to sorting buttons
var sortByAsc = document.getElementById('sort-date-asc');
if (sortByAsc) {
sortByAsc.addEventListener('click', () => {
    sortTableByDate('asc');
});
}

var sortByDesc = document.getElementById('sort-date-desc')
if (sortByDesc) {
sortByDesc.addEventListener('click', () => {
    sortTableByDate('desc');
});
}

//sort by duration
//not implemented


// search rows by title (with event listener)

var searchByTitleInput = document.getElementById('searchInput')
if (searchByTitleInput) {
    searchByTitleInput.addEventListener('input', function() {
    let searchTerm = this.value.toLowerCase();
    let rows = document.querySelectorAll('#resultsTable .title-cell');
    
    rows.forEach(cell => {
        let title = cell.textContent.toLowerCase();
        if (title.includes(searchTerm)) {
            cell.parentElement.style.display = '';
        } else {
            cell.parentElement.style.display = 'none';
        }
    });
});
}




//on load

window.onload = function() {
    if (document.getElementById('resultsTable')) {
    addedPodsOrNone();
    //we will also try to display the addPod table based on the session file
    //var rawJson = document.getElementById('json-output').getAttribute('data-json');
    //console.log("Raw JSON:", rawJson);  // Debugging line
    //console.log("Length of Raw JSON:", rawJson.length);  // Debugging line
        //var testJson = '{ "key": "value", "key2": "value2" }';
        //console.log(testJson);
        //console.log(JSON.parse(testJson));  // Should work

        //var addedPods = {{ added_pods | tojson }}; //this needs to be in the html template
        var dataContainer = document.getElementById('data-container');
        var addedPods = JSON.parse(dataContainer.getAttribute('data-added-pods'));
        //console.log("Type of addedPods:", typeof addedPods); //debugging line
        console.log("Content of addedPods:", addedPods);  // Debugging line
        if (Array.isArray(addedPods)) {
            addedPods.forEach(function(pod) {
                console.log(pod);
            });
        } else {
            console.error("addedPods is not an array");
        }
        
        //handling the added pod
        let addedDiv = document.getElementById('addedResults');
        //addedDiv.innerHTML = '';
        let tableBody = document.getElementById('resultsTable').getElementsByTagName('tbody')[0];

        addedPods.forEach(pod => {

            let newDiv = document.createElement('div');
            newDiv.className = 'added-pod card w-50 mb-3'; //bs class
            newDiv.dataset.url = pod.feeddata[0].url; // store url in data variable

            let newDeeperDiv = document.createElement('div');
            newDeeperDiv.className = 'card-body';


            let podcastImage = document.createElement('img');
            if (pod.feeddata && pod.feeddata.length > 0) {
                podcastImage.src = pod.feeddata[0].icon || "n/a";
            } else {
                podcastImage.textContent = "n/a";
            }
            podcastImage.className = 'added-pod-icon';
            newDeeperDiv.appendChild(podcastImage);

            let titleContainer = document.createElement('div');
            titleContainer.className = 'text-container';
            let podcastTitle = document.createElement('span');
            if (pod.feeddata && pod.feeddata.length > 0) {
                podcastTitle.textContent = pod.feeddata[0].title || "n/a";
            } else {
                podcastTitle.textContent = "n/a";
            }
            podcastTitle.className = 'added-pod-title';
            titleContainer.appendChild(podcastTitle);
            newDeeperDiv.appendChild(titleContainer);


            let removeButton = document.createElement('button');
            removeButton.textContent = '';
            removeButton.className = 'added-pod-remove-button btn-close' //bs class
            
            removeButton.addEventListener('click', function() {
                removePod(pod.feeddata[0].url);  // Assuming the URL is stored in data.pod[0].url
            });
            newDeeperDiv.appendChild(removeButton);

            newDiv.appendChild(newDeeperDiv);

            

            addedDiv.appendChild(newDiv);

            //let podcastEpCount = document.createElement('span');
            //podcastEpCount.textContent = data.pod.epCount;
            //addedDiv.appendChild(podcastTitle);

            //handling adding the eps
            
            //for now, clearing previous
            //tableBody.innerHTML = '';
            //console.log("pod.episodes:", pod.episodes); //for debugging
            if (pod.episodes) {
                pod.episodes.forEach(episode => {
                    //console.log("logging an episode:", episode); //for debugging

                    let rowElement = document.createElement('tr');
                    rowElement.dataset.url = pod.feeddata[0].url; // Store URL in data attribute of the row element
        
                    //ICON
                    // no icon -> display name of the feed instead
                    if (episode.icon === '/static/blanksquare.jpg') {
                        let nonImgElement = document.createElement('span');
                        nonImgElement.textContent = pod.feeddata[0].title;
                        nonImgElement.className = 'no-icon-so-just-title';
                        rowElement.appendChild(nonImgElement);
                    // yes icon -> display the icon
                    } else {
                        let imgElement = document.createElement('img');
                        if (episode.icon) {
                            imgElement.src = episode.icon;
                        } else {
                            imgElement.src = podcastImage.src
                        }
                        imgElement.width = 50;
                        imgElement.height = 50;
                        imgElement.loading = 'lazy';
                        rowElement.appendChild(imgElement);
                    }
        
                    
                    //TITLE
                    let titleDescId = `collapsedDesc${descCounter++}`;
                    let titleCell = document.createElement('td');
                    
                    let titleCollapse = document.createElement('a');
                    titleCollapse.className = 'title-collapse';
                    titleCollapse.setAttribute('data-bs-toggle', 'collapse');
                    titleCollapse.setAttribute('href', `#${titleDescId}`);
                    titleCollapse.setAttribute('role', 'button');
                    titleCollapse.setAttribute('aria-expanded', 'false');
                    titleCollapse.setAttribute('aria-controls', titleDescId);
                    titleCollapse.textContent = episode.title;

                    titleCell.appendChild(titleCollapse);
                    titleCell.className = 'title-cell'; // for the search by title event listener (way down below)
                    
        

                    //desc
                    let collapseDiv = document.createElement('div');
                    collapseDiv.className = 'collapse';
                    collapseDiv.id = titleDescId;

                    let cardDiv = document.createElement('div');
                    cardDiv.className = 'card card-body desc-body';
                    cardDiv.innerHTML = episode.desc; 

                    collapseDiv.appendChild(cardDiv);
                    titleCell.appendChild(collapseDiv);

                    rowElement.appendChild(titleCell);
        
                    //let descCell = document.createElement('td');
                    //descCell.textContent = episode.desc;
                    //rowElement.appendChild(descCell);
        
                    //DATE
                    let dateCell = document.createElement('td');
                    let date = new Date(episode.date);
                    dateCell.textContent = date.toLocaleDateString("fr-FR");
                    rowElement.appendChild(dateCell);
        
                    //DURATION
                    let durationCell = document.createElement('td');
                    durationCell.textContent = episode.duration;
                    rowElement.appendChild(durationCell);
                    
                    //EMBEDDED OR LINKED
                    let playCell = document.createElement('td');
                    //check if can be easily embedded
                    let fileExtension = /\.(mp3|wav|ogg)(\?|$)/i;
                    //if yes, make button with which we can play the ep
                    if (fileExtension.test(episode.link)) {
                        let button = document.createElement('button');
                        button.innerHTML = "&#9655;";
                        button.className = 'btn btn-outline-warning';
                        playCell.appendChild(button);
        
                        button.addEventListener('click', () => {
                            let audioElement = playCell.querySelector('audio');
                            if (audioElement) {
                                // Remove the audio element
                                audioElement.remove();
                            } else {
                                // Create and append audio element
                                audioElement = document.createElement('audio');
                                audioElement.controls = true;
                                audioElement.src = episode.link; // Assuming episode.link contains the audio URL
                                playCell.appendChild(audioElement);
                            }
                        });
                        //if not, create link
                    } else {
                        let link = document.createElement('a');
                        link.href = episode.link;
                        link.textContent = "Follow Link";
                        playCell.appendChild(link);
                    }
                    
                    rowElement.appendChild(playCell);
        
        
                    tableBody.appendChild(rowElement);
        
                    
                    
                });
        }

        });
        sortTableByDate('desc');
        addedPodsOrNone();
    }
}


// thing for telling my my display size (by ddb)

function updateDimensions() {
    var width = window.innerWidth;
    var height = window.innerHeight;
    var aspectRatio = width / height;
    var scaledHeight = 16 / aspectRatio;
    var dimensionsShower = document.getElementById("dimensions");
    if (dimensionsShower) {
        dimensionsShower.innerText = `Width: ${width}, Height: ${height}, Aspect ratio: 16:${scaledHeight.toFixed(2)}`;
    }
}

window.onresize = updateDimensions;
updateDimensions();