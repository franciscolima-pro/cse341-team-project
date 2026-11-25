const hookTripsCatalog = async () => {
    const listEl = document.getElementById('trips-list');
    const templateEl = document.getElementById('trip-card-template');
    const regionSelect = document.getElementById('region-filter');
    const seasonSelect = document.getElementById('season-filter');

    if (listEl && templateEl && regionSelect && seasonSelect) {
        const loadingEl = document.getElementById('trips-loading');
        const errorEl = document.getElementById('trips-error');
        const emptyEl = document.getElementById('trips-empty');
        const paginationEl = document.getElementById('trips-pagination');
        const previousButton = document.getElementById('trips-previous');
        const nextButton = document.getElementById('trips-next');
        const pageStatusEl = document.getElementById('trips-page-status');

        // 1-Pagination: Read the requested starting page from the URL, defaulting to page 1.
        const query = new URLSearchParams(window.location.search);
        const requestedPage = Number(query.get('page'));
        let currentPage = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;

        // 1-Pagination: Track requests so an older response cannot overwrite a newer page.
        let requestId = 0;

        const addFilterOptions = (select, values) => {
            const existingValues = new Set(
                [...select.options].map((option) => option.value)
            );
            values.forEach((value) => {
                if (existingValues.has(value)) {
                    return;
                }
                const option = document.createElement('option');
                option.value = value;
                option.textContent = value.charAt(0).toUpperCase() + value.slice(1);
                select.append(option);
                existingValues.add(value);
            });
        };

        const applyFilters = () => {
            let visibleTrips = 0;
            listEl.querySelectorAll('.route-card').forEach((card) => {
                const matchesRegion =
                    regionSelect.value === 'all'
                    || card.querySelector('.route-region').textContent === regionSelect.value;
                const matchesSeason =
                    seasonSelect.value === 'all'
                    || card.querySelector('[data-field="season-label"]').textContent === seasonSelect.value;
                card.hidden = !matchesRegion || !matchesSeason;
                if (!card.hidden) {
                    visibleTrips += 1;
                }
            });
            emptyEl.hidden = visibleTrips > 0;
        };

        // 1-Pagination: Render only the trips returned for the currently selected page.
        const renderTrips = (trips) => {
            const fragment = document.createDocumentFragment();
            trips.forEach((trip) => {
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
        };

        // 1-Pagination: Request one page from the API and update the trip list and controls.
        const loadTrips = async (page) => {
            const currentRequestId = ++requestId;
            currentPage = page;

            // 1-Pagination: Show loading feedback and disable controls during the request.
            loadingEl.hidden = false;
            errorEl.hidden = true;
            emptyEl.hidden = true;
            previousButton.disabled = true;
            nextButton.disabled = true;
            paginationEl.hidden = true;

            // 1-Pagination: Request 10 trips for the selected page.
            const params = new URLSearchParams({ page: String(page), limit: '10' });

            try {
                // 1-Pagination: Fetch the requested page using the API's page and limit parameters.
                const response = await fetch(`/api/trips?${params}`);
                if (!response.ok) {
                    throw new Error(`Failed to load trips (${response.status})`);
                }

                const payload = await response.json();
                // 1-Pagination: Ensure the API returned both the page data and its metadata.
                if (!Array.isArray(payload.trips) || !payload.pagination) {
                    throw new Error('Trip response did not contain the expected data');
                }

                // 1-Pagination: Ignore responses from requests superseded by a later page selection.
                if (currentRequestId !== requestId) {
                    return;
                }

                // 1-Pagination: Recover to the last available page if the requested page no longer exists.
                if (page > payload.pagination.totalPages && payload.pagination.totalPages > 0) {
                    loadTrips(payload.pagination.totalPages);
                    return;
                }
                // 1-Pagination: Return to page 1 when the collection has no records.
                if (page > 1 && payload.pagination.totalPages === 0) {
                    loadTrips(1);
                    return;
                }

                addFilterOptions(
                    regionSelect,
                    [...new Set(payload.trips.map((trip) => trip.region).filter(Boolean))]
                );
                addFilterOptions(
                    seasonSelect,
                    [...new Set(payload.trips.map((trip) => trip.bestSeason).filter(Boolean))]
                );
                renderTrips(payload.trips);
                applyFilters();

                // 1-Pagination: Update button states and page count from API metadata.
                currentPage = payload.pagination.page;
                previousButton.disabled = !payload.pagination.hasPreviousPage;
                nextButton.disabled = !payload.pagination.hasNextPage;
                pageStatusEl.textContent =
                    `Page ${payload.pagination.page} of ${payload.pagination.totalPages} `
                    + `(${payload.pagination.totalItems} trips)`;
                paginationEl.hidden = payload.pagination.totalPages <= 1;
            } catch (error) {
                // 1-Pagination: Ignore failures from requests that are no longer current.
                if (currentRequestId !== requestId) {
                    return;
                }
                console.error('Error loading trips:', error);
                errorEl.hidden = false;
                errorEl.textContent = 'Unable to load trips right now. Please try again in a moment.';
            } finally {
                // 1-Pagination: Hide loading feedback only for the latest request.
                if (currentRequestId === requestId) {
                    loadingEl.hidden = true;
                }
            }
        };

        regionSelect.addEventListener('change', applyFilters);
        seasonSelect.addEventListener('change', applyFilters);

        // 1-Pagination: Load the previous page only when one is available.
        previousButton.addEventListener('click', () => {
            if (currentPage > 1) {
                loadTrips(currentPage - 1);
            }
        });

        // 1-Pagination: Request the next page when the next button is activated.
        nextButton.addEventListener('click', () => loadTrips(currentPage + 1));

        // 1-Pagination: Load the page requested in the URL or the default first page.
        loadTrips(currentPage);
        return;
    }

};

const createScheduleCard = (schedule) => {
    const card = document.createElement('div');
    card.className = 'schedule-card';

    const times = document.createElement('div');
    times.className = 'schedule-times';

    const createTimeBlock = (label, time) => {
        const block = document.createElement('div');
        block.className = 'time-block';

        const timeLabel = document.createElement('span');
        timeLabel.className = 'time-label';
        timeLabel.textContent = label;

        const timeValue = document.createElement('span');
        timeValue.className = 'time-value';
        timeValue.textContent = time || '';

        block.append(timeLabel, timeValue);
        return block;
    };

    const arrow = document.createElement('span');
    arrow.className = 'time-arrow';
    arrow.textContent = '→';
    times.append(
        createTimeBlock('Departs', schedule.departureTime),
        arrow,
        createTimeBlock('Arrives', schedule.arrivalTime)
    );

    const days = document.createElement('div');
    days.className = 'schedule-days';
    (Array.isArray(schedule.daysOfWeek) ? schedule.daysOfWeek : []).forEach((day) => {
        const badge = document.createElement('span');
        badge.className = 'day-badge';
        badge.textContent = String(day).slice(0, 3);
        days.appendChild(badge);
    });

    const bookLink = document.createElement('a');
    bookLink.className = 'book-btn';
    bookLink.href = `/trips/booking/${encodeURIComponent(schedule.id)}`;
    bookLink.textContent = 'Book Now';

    card.append(times, days, bookLink);
    return card;
};

const hookTripScheduleFilters = () => {
    const container = document.querySelector('.route-schedules[data-trip-id]');
    const grid = container?.querySelector('[data-schedules-grid]');
    const status = container?.querySelector('.schedules-status');
    const buttons = document.querySelectorAll('[data-schedule-month]');

    if (!container || !grid || !status || buttons.length === 0) {
        return;
    }

    let requestId = 0;
    buttons.forEach((button) => {
        button.addEventListener('click', async () => {
            const selectedMonth = button.dataset.scheduleMonth;
            const currentRequestId = ++requestId;

            buttons.forEach((monthButton) => {
                monthButton.setAttribute(
                    'aria-pressed',
                    String(monthButton === button)
                );
            });

            grid.replaceChildren();
            status.textContent = 'Loading schedules...';

            try {
                const tripId = encodeURIComponent(container.dataset.tripId);
                const response = await fetch(
                    `/api/trips/${tripId}/schedules?month=${encodeURIComponent(selectedMonth)}`
                );

                if (!response.ok) {
                    throw new Error(`Failed to load schedules (${response.status})`);
                }

                const schedules = await response.json();
                if (!Array.isArray(schedules)) {
                    throw new Error('The schedules response was not an array');
                }
                if (currentRequestId !== requestId) {
                    return;
                }

                const fragment = document.createDocumentFragment();
                schedules.forEach((schedule) => {
                    fragment.appendChild(createScheduleCard(schedule));
                });
                grid.replaceChildren(fragment);
                status.textContent = schedules.length
                    ? `${schedules.length} schedule${schedules.length === 1 ? '' : 's'} available.`
                    : 'No schedules are available for this month.';
            } catch (error) {
                if (currentRequestId !== requestId) {
                    return;
                }

                console.error('Failed to load trip schedules:', error);
                status.textContent = 'Unable to load schedules. Please try again.';
            }
        });
    });
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

const hookDashboardBookings = async () => {
    const dashboard = document.querySelector('.dashboard-page[data-user-email]');
    const listEl = document.getElementById('dashboard-bookings-list');
    const loadingEl = document.getElementById('dashboard-bookings-loading');
    const emptyEl = document.getElementById('dashboard-bookings-empty');
    const errorEl = document.getElementById('dashboard-bookings-error');

    if (!dashboard || !listEl || !loadingEl || !emptyEl || !errorEl) {
        return;
    }

    const userEmail = dashboard.dataset.userEmail.toLowerCase();

    try {
        const response = await fetch('/api/bookings');
        if (!response.ok) {
            throw new Error(`Failed to load bookings (${response.status})`);
        }

        const bookings = await response.json();
        if (!Array.isArray(bookings)) {
            throw new Error('Booking response was not an array');
        }

        const matchingBookings = bookings.filter((booking) =>
            Array.isArray(booking.passengers)
            && booking.passengers.some((passenger) =>
                typeof passenger.email === 'string'
                && passenger.email.trim().toLowerCase() === userEmail
            )
        );

        if (matchingBookings.length === 0) {
            emptyEl.hidden = false;
            return;
        }

        const fragment = document.createDocumentFragment();
        matchingBookings.forEach((booking) => {
            const card = document.createElement('article');
            card.className = 'detail-card';

            const heading = document.createElement('h3');
            heading.textContent = `Booking: ${booking.id}`;

            const ticket = document.createElement('p');
            ticket.textContent = `Ticket Class: ${booking.ticketClass || ''}`;

            const day = document.createElement('p');
            day.textContent = `Travel Day: ${booking.selectedDay || ''}`;

            const date = document.createElement('p');
            date.textContent = `Booked On: ${new Date(booking.createdAt).toLocaleDateString()}`;

            card.append(heading, ticket, day, date);
            booking.passengers
                .filter((passenger) =>
                    typeof passenger.email === 'string'
                    && passenger.email.trim().toLowerCase() === userEmail
                )
                .forEach((passenger) => {
                    const passengerInfo = document.createElement('p');
                    passengerInfo.textContent =
                        `Passenger: ${passenger.firstName} ${passenger.lastName} - ${passenger.email}`;
                    card.appendChild(passengerInfo);
                });

            fragment.appendChild(card);
        });

        listEl.replaceChildren(fragment);
    } catch (error) {
        console.error('Error loading dashboard bookings:', error);
        errorEl.hidden = false;
    } finally {
        loadingEl.hidden = true;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    hookTripsCatalog();
    hookTripScheduleFilters();
    hookTrainsCatalog();
    hookDashboardBookings();
});