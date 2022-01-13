const url = 'https://api.punkapi.com/v2/beers/';

const elements = {
    input: document.querySelector('#search_input'),
    list: document.querySelector('#list'),
    searchList: document.querySelector('#search_list'),
    searchIcon: document.querySelector('#search_icon'),
    recent: document.querySelector('#recent'),
}

class App {
    constructor(apiUrl, elements) {
        this.url = apiUrl;
        //---Elements
        this.input = elements.input;
        this.list = elements.list;
        this.searchList = elements.searchList;
        this.searchIcon = elements.searchIcon;
        this.recent = elements.recent;
        this.beerList = [];
        this.recentList = [];

        //___Event Listeners
        this.input.addEventListener('keyup', this.handler.bind(this));
        this.searchIcon.addEventListener('click', this.handler.bind(this));
        document.addEventListener("click", this.handler2.bind(this));

        this.searchList.style.display = 'none';
    }

    async renderStartList() {
        const beers = await this.fetchNumberOfBeers(0, 5);
        this.beerList = new BeerList(beers);
        this.updateBeerList();
    }

    handler(event) {
        const {key, target} = event;
        if (key === 'Enter' && this.input.value.length > 0 || target === this.searchIcon && this.input.value.length > 0) {
            this.search()
        }
    }

    handler2(event) {
        if (event.target.closest('ul') === this.searchList || event.target === this.input) {
        return;
        }
    this.searchList.innerHTML = '';
    this.searchList.style.display = 'none';
    }

    search() {
        this.searchList.innerHTML = '';
        this.fetchBeersByName(this.input.value)
            .then(beers => {
                if (beers.length === 0) {
                    alert('There were no properties found for \n' +
                        '   the given location.');
                    return;
                }
                beers.forEach(beer => this.searchList.insertAdjacentHTML("afterbegin", new Beer(beer).render()));
                this.searchList.style.display = 'block';
            });
        this.updateRecent(this.input.value);
        this.input.value = '';
    }

    updateBeerList() {
        this.list.innerHTML = '';
        this.beerList.beers.forEach(beer => {
            this.list.insertAdjacentHTML('afterbegin', new Beer(beer).render());
        })
    }

    updateRecent(value) {
        console.log('val:', value);
        this.recent.innerHTML = '';

        if (this.recentList.length === 3) this.recentList.shift();
        this.recentList.push(value);

        this.recentList.forEach(item => {
            this.recent.insertAdjacentHTML('afterbegin', `<li>${item}</li>`)
        })
    }

    async fetchNumberOfBeers(start, end) {
        try {
            const response = await fetch(this.url);
            if (response.ok) {
                const jsonResponse = await response.json();
                return jsonResponse.slice(start, end);
            }
        } catch (error) {
            console.log(error);
        }
    }

    async fetchBeersByName(name) {
        try {
            const response = await fetch(this.url + '?beer_name=' + name);
            if (response.ok) {
                const jsonResponse = await response.json();
                return await jsonResponse;
            }
        } catch (error) {
            console.log(error);
        }
    }

    async fetchAllBeers() {
        try {
            const response = await fetch(this.url);
            if (response.ok) {
                const jsonResponse = await response.json();
                return await jsonResponse;
            }
        } catch (error) {
            console.log(error);
        }
    }
}

class BeerList {
    constructor(beers) {
        this.beers = beers;
        this.list = beers.map(beer => new Beer(beer).render());
    }

}

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

const app = new App(url, elements);
app.renderStartList().then();
