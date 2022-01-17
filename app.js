const url = 'https://api.punkapi.com/v2/beers';

const elements = {
    searchInput: document.querySelector('#search_input'),
    mainList: document.querySelector('#main-list'),
    searchList: document.querySelector('#search_list'),
    searchIcon: document.querySelector('#search_icon'),
    recentList: document.querySelector('#recent'),
    loadMoreLink: document.querySelector('#load_more'),
    scrollToTopBtn: document.querySelector('#scroll-to-top-btn'),
    favouritesBtn: document.querySelector('#favourites-btn'),
    counterOfFavoriteItems: document.querySelector('#counter-of-favorite-items'),
    modal: document.querySelector('#favoritesModal'),
    closeModalSpan: document.querySelector('.close'),
    modalList: document.querySelector('#modal-list'),
    singleItemModal: document.querySelector('#single-item-modal'),
    singleItemModalList: document.querySelector('#single-item-modal-list'),
    closeSingleItemModalSpan: document.querySelector('#close-single-item-modal'),
}

class App {
    constructor(apiUrl, elements) {
        this.url = apiUrl;
        //---Elements----------------------------
        const {
            searchInput,
            mainList,
            searchList,
            searchIcon,
            recentList,
            loadMoreLink,
            scrollToTopBtn,
            favouritesBtn,
            counterOfFavoriteItems,
            modal,
            closeModalSpan,
            modalList,
            singleItemModal,
            singleItemModalList,
            closeSingleItemModalSpan
        } = elements;

        this.searchInput = searchInput;
        this.mainList = mainList;
        this.searchList = searchList;
        this.searchIcon = searchIcon;
        this.recentSearchesList = recentList;
        this.loadMoreLink = loadMoreLink;
        this.scrollToTopBtn = scrollToTopBtn;
        this.favouritesBtn = favouritesBtn;
        this.counterOfFavoriteItems = counterOfFavoriteItems;
        this.modal = modal;
        this.closeModalSpan = closeModalSpan;
        this.modalList = modalList;
        this.singleItemModal= singleItemModal;
        this.singleItemModalList = singleItemModalList;
        this.closeSingleItemModalSpan =closeSingleItemModalSpan;
        //----------------------------------------
        //---State--------------------------------
        this.favorites = new Set();
        this.recent = [];
        this.page = 1;
        this.itemsOnPage = 25;
        //----------------------------------------
        //___Event Listeners----------------------
        this.searchInput.addEventListener('keyup', this.searchHandler.bind(this));
        this.searchIcon.addEventListener('click', this.searchHandler.bind(this));
        this.loadMoreLink.addEventListener('click', this.loadMoreLinkHandler.bind(this));
        this.favouritesBtn.addEventListener('click', this.favouritesBtnHandler.bind(this));
        this.closeModalSpan.addEventListener('click', this.closeModalHandler.bind(this));
        this.closeSingleItemModalSpan.addEventListener('click', this.closeSingleItemModal.bind(this));
        document.addEventListener('keyup', this.escBtnSingleItemModalHandler.bind(this));
        document.addEventListener("click", this.hideSearchListHandler.bind(this));
        document.addEventListener('click', this.searchRecallHandler.bind(this));
        document.addEventListener('click', this.addToFavoritesBtnHandler.bind(this));
        document.addEventListener('click', this.cardHeaderClickHandler.bind(this));
        window.addEventListener("scroll", this.scrollHandler.bind(this));
        window.addEventListener('click', (e) => e.target === this.modal ? this.closeModalHandler() : null);
        window.addEventListener('click', (e) => e.target === this.singleItemModal ? this.closeSingleItemModal() : null);
        this.scrollToTopBtn.addEventListener("click", this.scrollToTop.bind(this));
        //----------------------------------------
        //---Initialization_______________________
        this.rootElement = document.documentElement;
        this.searchList.style.display = 'none';
        this.scrollToTopBtn.style.visibility = 'hidden';

        if (localStorage.recent) {
            this.recent = JSON.parse(localStorage.getItem('recent'));
            this.updateRecent();
        }

        if (localStorage.favorites) {
            JSON.parse(localStorage.getItem('favorites')).forEach(item => {
                this.favorites.add(+item);
            });
            this.updateFavoritesBtn();
            this.updateCounterOfFavoriteItems();
        }
    }

    escBtnSingleItemModalHandler({ key }) {
        if (key === 'Escape') {
            this.closeSingleItemModal();
        }
    }

    async cardHeaderClickHandler({ target }) {
        if (target.classList.contains('card_header') && !target.closest('#single-item-modal-list')) {
            this.closeModalHandler();
            this.openSingleItemModal();
            const id = +target.closest('article.item_card').dataset.itemId;
            const item = await this.fetchItemsById([id]);
            this.insertItemsInList(item, this.singleItemModalList);
        }
    }

    closeModalHandler() {
        this.modalList.innerHTML = '';
        this.modal.style.display = 'none';
    }

    closeSingleItemModal() {
        this.singleItemModalList.innerHTML = '';
        this.singleItemModal.style.display = 'none';
    }

    openSingleItemModal() {
        this.singleItemModal.style.display = 'block';
    }

    openFavoritesModal() {
        this.modal.style.display = 'block';
    }

    favouritesBtnHandler() {
        const empty = this.favorites.size === 0;
        if (empty) {
            return;
        }
        this.openFavoritesModal();
        this.fetchItemsById(Array.from(this.favorites))
            .then(itemsArray => {
                this.insertItemsInList(itemsArray, this.modalList);
            });
    }

    updateCounterOfFavoriteItems() {
        this.counterOfFavoriteItems.textContent = this.favorites.size || '';
        this.updateFavoritesBtn();
    }

    updateFavoritesBtn() {
        if (this.favorites.size) {
            this.favouritesBtn.classList.add('available');
        } else {
            this.favouritesBtn.classList.remove('available');
        }
    }

    addToFavoritesBtnHandler({ target }) {
        const isAddToFavoritesBtn = target.classList.contains('add-to-favorites-btn');

        if (isAddToFavoritesBtn) {
            this.toggleAddToFavoritesBtn(target);

            const id = +target.closest('article.item_card').dataset.itemId;
            const btnIsInSearchList = target.closest('#search_list');
            const btnIsInModalList = target.closest('#modal-list');
            const btnIsInSingleItemModalList = target.closest('#single-item-modal-list');

            if (btnIsInSearchList) {
                this.checkMainListOnFavorites(id);
            }

            if (btnIsInModalList) {
                this.checkMainListOnFavorites(id);
                target.closest('ul#modal-list li').remove();
                if (this.favorites.size === 1) {
                    this.closeModalHandler();
                }
            }

            if (btnIsInSingleItemModalList) {
                this.checkMainListOnFavorites(id);
            }

            if (this.favorites.has(id)) {
                this.favorites.delete(id);
                this.updateFavoritesInLocalStorage();
            } else {
                this.favorites.add(id);
                this.updateFavoritesInLocalStorage();
            }
            this.updateCounterOfFavoriteItems();
        }
    }

    updateFavoritesInLocalStorage() {
        localStorage.setItem('favorites', JSON.stringify(Array.from(this.favorites)));
    }

    checkMainListOnFavorites(id) {
        const mainListButton = this.mainList.querySelector(`[data-item-id="${id}"] button.add-to-favorites-btn`);
        if (mainListButton) {
            this.toggleAddToFavoritesBtn(mainListButton);
        }
    }

    toggleAddToFavoritesBtn(favoritesButton) {
        favoritesButton.classList.toggle('in-favorites');
        if (favoritesButton.classList.contains('in-favorites')) {
            favoritesButton.textContent = 'Remove';
        } else {
            favoritesButton.textContent = 'Add';
        }
    }

    searchRecallHandler({ target }) {
        const isRecentSearchLiElement = target.closest('ul') === this.recentSearchesList && target.classList.contains('recent-search-item');
        if (isRecentSearchLiElement) {
            this.searchInput.value = target.textContent;
            this.search(true);
        }
    }

    scrollHandler() {
        const scrolledToTop = window.scrollY === 0;
        if (scrolledToTop) {
            setTimeout(this.hideScrollToTopButton.bind(this), 300);
            this.scrollToTopBtn.style.opacity = '0';
        } else {
            this.scrollToTopBtn.style.visibility = 'visible';
            this.scrollToTopBtn.style.opacity = '1';
        }
    }

    hideScrollToTopButton() {
        this.scrollToTopBtn.style.visibility = 'hidden';
    }

    scrollToTop() {
        this.rootElement.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }

    searchHandler({ key, target }) {
        if (key === 'Enter' && this.searchInput.value.length > 0 || target === this.searchIcon && this.searchInput.value.length > 0) {
            this.search();
        }
    }

    async loadMoreLinkHandler(event) {
        event.preventDefault();
        const items = await this.fetchItemsPerPage();
        this.insertItemsInList(items, this.mainList);
        if (items.length < this.itemsOnPage) {
            this.loadMoreLink.innerHTML = '';
            requestAnimationFrame(() => {
                requestAnimationFrame(() => alert('No more items left.'));
            });
        }
    }

    hideSearchListHandler({ target }) {
        const noNeedToHide = target.closest('ul#search_list') === this.searchList || target === this.searchInput;
        if (noNeedToHide) {
            return;
        }
        this.clearSearchList();
        this.hideSearchList();
    }

    async renderStartList() {
        const itemsArray = await this.fetchItemsPerPage();
        this.insertItemsInList(itemsArray, this.mainList);
    }


    async search(recall = false) {
        this.clearSearchList();
        const itemsArray = await this.fetchItemsByName(this.searchInput.value);
        const nothingFound = itemsArray.length === 0;
        if (nothingFound) {
            alert('There were no properties found for \n' +
                '   the given location.');
            this.searchInput.value = '';
            return;
        }
        this.insertItemsInList(itemsArray, this.searchList);
        this.openSearchList();
        this.addToRecent(this.searchInput.value);
        if (!recall) {
            this.searchInput.value = '';
        }
    }

    insertItemsInList(itemsArray, list) {
        list.insertAdjacentHTML("beforeend", new ItemsList(itemsArray, this.favorites).render());
    }

    openSearchList() {
        this.searchList.style.display = 'block';
    }

    clearSearchList() {
        this.searchList.innerHTML = '';
    }

    hideSearchList() {
        this.searchList.style.display = 'none';
    }

    addToRecent(value) {
        this.recentSearchesList.innerHTML = '';
        if (!this.recent.includes(value)) {
            this.recent.push(value);

            if (this.recent.length > 3) {
                this.recent.shift();
            }
        }
        localStorage.setItem('recent', JSON.stringify(this.recent));
        this.updateRecent();
    }

    updateRecent() {
        this.recent.forEach(text => {
            this.recentSearchesList.insertAdjacentHTML('afterbegin', `<li class="recent-search-item">${text}</li>`);
        });
    }

    async fetchItemsByName(name) {
        try {
            const response = await fetch(this.url + '/?beer_name=' + name);
            if (response.ok) {
                return response.json();
            }
        } catch (error) {
            console.log(error);
        }
    }

    async fetchItemsById(idsArray) {
        try {
            const response = await fetch(this.url + `/?ids=${idsArray.join('|')}`);
            if (response.ok) {
                return response.json();
            }
        } catch (error) {
            console.log(error);
        }
    }

    async fetchItemsPerPage() {
        try {
            const response = await fetch(this.url + '?page=' + this.page + '&per_page=' + this.itemsOnPage);
            if (response.ok) {
                this.page++;
                return response.json();
            }
        } catch(error) {
            console.log(error);
        }
    }
}

class ItemsList {
    constructor(items, favorites) {
        this.beers = items;
        this.favorites = favorites;

    }

    render() {
        return this.beers
            .map(item => new ItemCard(item, this.favorites.has(item.id)).render())
            .join('');
    }

}

class ItemCard {
    constructor(item, inFavorites) {
        const {id, name, description, image_url} = item;

        this.id = id;
        this.title = name;
        this.description = description;
        this.image_url = image_url;
        this.price = Math.floor(Math.random() * 100/4);
        this.inFavorites = inFavorites;
    }

    render() {
        return `
            <li> 
                <article class="item_card" data-item-id="${this.id}">
                    <h4 class="card_header">${this.title}</h4>
                    <img class="card_image" src="${this.image_url}" alt="image">
                    <p class="description">${this.description}</p>
                    <fieldset class="item-card_bottom">            
                        <p class="price">\$${this.price}</p>
                        <button 
                            type="button" 
                            class="add-to-favorites-btn ${this.inFavorites ? 'in-favorites' : ''}" 
                            >
                                ${this.inFavorites ? 'Remove' : 'Add'}
                        </button>
                    </fieldset>
                </article>
            </li>`
    }
}

const app = new App(url, elements);
app.renderStartList();
