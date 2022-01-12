const url = 'https://api.punkapi.com/v2/beers/';

const input = document.querySelector('#search_input');
const list = document.querySelector('#list');
const searchList = document.querySelector('#search_list');
const searchIcon = document.querySelector('#search_icon');
const recent = document.querySelector('#recent');

let beerList;
const recentArr = [];
searchList.style.display = 'none';

input.addEventListener('keyup', handler);
searchIcon.addEventListener('click', handler);
document.addEventListener("click", event => {
    if (event.target.closest('ul') === searchList || event.target === input) {
        return;
    }
    console.log(event.target)
    searchList.innerHTML = '';
    searchList.style.display = 'none';
})


class Beer {
    constructor(beer) {
        this.title = beer.name;
        this.description = beer.description;
        this.image_url = beer.image_url;
        this.price = Math.floor(Math.random() * 100);
    }

    render() {
        return `
            <li> 
                <h4>${this.title}</h4>
                <article class="beer_card">
                    <img class="card_image" src="${this.image_url}" alt="beer image">
                    <p>${this.description}</p>
                    <p>\$${this.price}</p>
                    </article>
            </li>`
    }
}

class BeerList {
    constructor(beers) {
        this.beers = beers;
        this.list = beers.map(beer => new Beer(beer).render());
    }
}

class App {

    static async renderStartList() {
        const beers = await App.fetchNumberOfBeers(0, 5);
        beerList = new BeerList(beers);
        updateBeerList();
    }

    static async fetchNumberOfBeers(start, end) {
        try {
            const response = await fetch(url);
            if (response.ok) {
                const jsonResponse = await response.json();
                return jsonResponse.slice(start, end);
            }
        } catch (error) {
            console.log(error);
        }
    }

    static async fetchAllBeers() {
        try {
            const response = await fetch(url);
            if (response.ok) {
                const jsonResponse = await response.json();
                return await jsonResponse;
            }
        } catch (error) {
            console.log(error);
        }
    }

    static async fetchBeersByName(name) {
        try {
            const response = await fetch(url + '?beer_name=' + name);
            if (response.ok) {
                const jsonResponse = await response.json();
                return await jsonResponse;
            }
        } catch (error) {
            console.log(error);
        }
    }

    static search() {
        searchList.innerHTML = '';
        App.fetchBeersByName(input.value)
            .then(beers => {
                if (beers.length === 0) {
                    alert('There were no properties found for \n' +
                        '   the given location.');
                    return;
                }
                beers.forEach(beer => searchList.insertAdjacentHTML("afterbegin", new Beer(beer).render()));
                searchList.style.display = 'block';
                updateRecent(input.value);
            });


        input.value = '';
    }
}


function handler(event) {
    const {key, target} = event;
    if (key === 'Enter' && input.value.length > 0 || target === searchIcon && input.value.length > 0) {
        App.search()
    }
}

function updateRecent(value) {
    recent.innerHTML = '';

    if (recentArr.length === 3) recentArr.shift();
    recentArr.push(value);


    recentArr.forEach(item => {
        recent.insertAdjacentHTML('afterbegin', `<li>${item}</li>`)
    })
}

function updateBeerList() {
    list.innerHTML = '';
    beerList.beers.forEach(beer => {
        list.insertAdjacentHTML('afterbegin', new Beer(beer).render());
    })
}



App.renderStartList();




