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

const hookUserAdmin = async () => {
    const listEl = document.getElementById('user-admin-list');
    if (!listEl) return;

    const loadingEl = document.getElementById('user-admin-loading');
    const errorEl = document.getElementById('user-admin-error');

    const loadUsers = async () => {
        loadingEl.hidden = false;
        errorEl.hidden = true;

        try {
            const response = await fetch('/api/users');
            const payload = await response.json();

            if (!response.ok) {
                throw new Error(payload.message || 'Unable to load users.');
            }

            listEl.replaceChildren();

            payload.users.forEach((user) => {
                const card = document.createElement('form');
                card.className = 'user-admin-card';

                const fields = [
                    ['name', 'Name'],
                    ['username', 'Username'],
                    ['email', 'Email']
                ];

                fields.forEach(([field, label]) => {
                    const wrapper = document.createElement('div');
                    const labelEl = document.createElement('label');
                    const input = document.createElement('input');

                    labelEl.textContent = label;
                    input.type = field === 'email' ? 'email' : 'text';
                    input.name = field;
                    input.value = user[field] || '';
                    input.required = true;

                    wrapper.append(labelEl, input);
                    card.append(wrapper);
                });

                const role = document.createElement('p');
                role.textContent = `Role: ${user.role?.name || 'Unknown'}`;
                card.append(role);

                const saveButton = document.createElement('button');
                saveButton.type = 'submit';
                saveButton.textContent = 'Save Changes';
                card.append(saveButton);

                const deleteButton = document.createElement('button');
                deleteButton.type = 'button';
                deleteButton.textContent = 'Delete User';
                card.append(deleteButton);

                card.addEventListener('submit', async (event) => {
                    event.preventDefault();

                    const updates = Object.fromEntries(new FormData(card));

                    try {
                        const result = await fetch(`/api/users/${user._id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(updates)
                        });

                        const data = await result.json();
                        if (!result.ok) throw new Error(data.message);

                        await loadUsers();
                    } catch (error) {
                        errorEl.textContent = error.message;
                        errorEl.hidden = false;
                    }
                });

                deleteButton.addEventListener('click', async () => {
                    if (!confirm(`Delete ${user.username}?`)) return;

                    try {
                        const result = await fetch(`/api/users/${user._id}`, {
                            method: 'DELETE'
                        });

                        const data = await result.json();
                        if (!result.ok) throw new Error(data.message);

                        await loadUsers();
                    } catch (error) {
                        errorEl.textContent = error.message;
                        errorEl.hidden = false;
                    }
                });

                listEl.append(card);
            });
        } catch (error) {
            errorEl.textContent = error.message;
            errorEl.hidden = false;
        } finally {
            loadingEl.hidden = true;
        }
    };

    await loadUsers();
};

document.addEventListener('DOMContentLoaded', () => {
    hookTripsCatalog();
    hookTripScheduleFilters();
    hookTrainsCatalog();
    hookUserAdmin();
});