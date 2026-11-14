const hookTripsCatalog = async () => {
    const listEl = document.getElementById('trips-list');
    const templateEl = document.getElementById('trip-card-template');
    const regionSelect = document.getElementById('region-filter');
    const seasonSelect = document.getElementById('season-filter');

    if (listEl && templateEl && regionSelect && seasonSelect) {
        const loadingEl = document.getElementById('trips-loading');
        const errorEl = document.getElementById('trips-error');
        const emptyEl = document.getElementById('trips-empty');

        try {
            const response = await fetch('/api/trips');
            if (!response.ok) {
                throw new Error(`Failed to load trips (${response.status})`);
            }

            const payload = await response.json();
            if (!Array.isArray(payload.trips)) {
                throw new Error('Trip response did not contain a trips list');
            }

            const regionParam = new URLSearchParams(window.location.search).get('region');
            const seasonParam = new URLSearchParams(window.location.search).get('season');
            const regions = [...new Set(payload.trips.map((trip) => trip.region).filter(Boolean))].sort();
            const seasons = [...new Set(payload.trips.map((trip) => trip.bestSeason).filter(Boolean))].sort();

            const addFilterOptions = (select, values, initialValue) => {
                values.forEach((value) => {
                    const option = document.createElement('option');
                    option.value = value;
                    option.textContent = value.charAt(0).toUpperCase() + value.slice(1);
                    select.append(option);
                });
                if (values.includes(initialValue)) {
                    select.value = initialValue;
                }
            };
            addFilterOptions(regionSelect, regions, regionParam);
            addFilterOptions(seasonSelect, seasons, seasonParam);

            const fragment = document.createDocumentFragment();
            payload.trips.forEach((trip) => {
                const card = templateEl.content.cloneNode(true);
                const cardEl = card.querySelector('.route-card');
                const setText = (field, value) => {
                    card.querySelector(`[data-field="${field}"]`).textContent = value ?? '';
                };

                if (typeof trip.region === 'string' && /^[a-z0-9-]+$/i.test(trip.region)) {
                    cardEl.classList.add(trip.region);
                }
                setText('name', trip.name);
                setText('region', trip.region);
                setText('start-station', trip.startStation);
                setText('end-station', trip.endStation);
                setText('duration', trip.duration);
                setText('distance', trip.distance);
                setText('description', trip.description);
                setText('season-label', trip.bestSeason);

                const seasonBadge = card.querySelector('[data-field="season"]');
                if (typeof trip.bestSeason === 'string' && /^[a-z0-9-]+$/i.test(trip.bestSeason)) {
                    seasonBadge.classList.add(`season-${trip.bestSeason}`);
                }

                const highlights = card.querySelector('[data-field="highlights"]');
                (Array.isArray(trip.highlights) ? trip.highlights : []).forEach((highlight) => {
                    const tag = document.createElement('span');
                    tag.className = 'highlight-tag';
                    tag.textContent = highlight;
                    highlights.append(tag);
                });

                card.querySelector('[data-field="details-link"]').href =
                    `/trips/${encodeURIComponent(trip.id)}`;
                fragment.append(card);
            });

            listEl.replaceChildren(fragment);

            const applyFilters = () => {
                let visibleTrips = 0;
                listEl.querySelectorAll('.route-card').forEach((card) => {
                    const matchesRegion =
                        regionSelect.value === 'all' || card.querySelector('.route-region').textContent === regionSelect.value;
                    const matchesSeason =
                        seasonSelect.value === 'all' ||
                        card.querySelector('[data-field="season-label"]').textContent === seasonSelect.value;
                    card.hidden = !matchesRegion || !matchesSeason;
                    if (!card.hidden) {
                        visibleTrips += 1;
                    }
                });
                emptyEl.hidden = visibleTrips > 0;
            };

            regionSelect.addEventListener('change', applyFilters);
            seasonSelect.addEventListener('change', applyFilters);
            applyFilters();
        } catch (error) {
            console.error('Error loading trips:', error);
            errorEl.hidden = false;
            errorEl.textContent = 'Unable to load trips right now. Please try again in a moment.';
        } finally {
            loadingEl.hidden = true;
        }
        return;
    }

};

const hookTrainsCatalog = async () => {
    const listEl = document.getElementById('trains-list');
    const templateEl = document.getElementById('train-card-template');
    if (!listEl || !templateEl) {
        return;
    }

    const loadingEl = document.getElementById('trains-loading');
    const errorEl = document.getElementById('trains-error');
    try {
        const response = await fetch('/api/trains');
        if (!response.ok) {
            throw new Error(`Failed to load trains (${response.status})`);
        }

        const payload = await response.json();
        const trains = payload.trains || [];
        const fragment = document.createDocumentFragment();

        trains.forEach((train) => {
            const card = templateEl.content.cloneNode(true);
            const imageEl = card.querySelector('[data-field="image"]');

            imageEl.src = train.imageUrl;
            imageEl.alt = train.imageAlt || `${train.name} train`;

            card.querySelector('[data-field="name"]').textContent = train.name;
            card.querySelector('[data-field="operator"]').textContent = train.operator;
            card.querySelector('[data-field="type"]').textContent = train.type;
            card.querySelector('[data-field="speed"]').textContent = `${train.maxSpeedKmh} km/h`;
            card.querySelector('[data-field="seats"]').textContent = `${train.capacity} seats`;
            card.querySelector('[data-field="power"]').textContent = train.powerSource;
            card.querySelector('[data-field="description"]').textContent = train.description;
            card.querySelector('[data-field="best-for"]').textContent = train.bestFor;

            fragment.appendChild(card);
        });

        listEl.replaceChildren(fragment);
        if (loadingEl) {
            loadingEl.hidden = true;
        }
    } catch (error) {
        console.error('Error loading trains:', error);
        if (loadingEl) {
            loadingEl.hidden = true;
        }
        if (errorEl) {
            errorEl.hidden = false;
            errorEl.textContent = 'Unable to load trains right now. Please try again in a moment.';
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    hookTripsCatalog();
    hookTrainsCatalog();
});