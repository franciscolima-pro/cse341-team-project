const hookRegionSorter = () => {
    const regionSelect = document.getElementById('region-filter');
    if (regionSelect) {
        regionSelect.addEventListener('change', () => {
            const selectedRegion = regionSelect.value;
            const url = new URL(window.location.href);

            if (selectedRegion && selectedRegion !== 'all') {
                url.searchParams.set('region', selectedRegion);
            } else {
                url.searchParams.delete('region');
            }
            
            window.location.href = url.toString();
        });
    }
};

const hookSeasonSorter = () => {
    const seasonSelect = document.getElementById('season-filter');
    if (seasonSelect) {
        seasonSelect.addEventListener('change', () => {
            const selectedSeason = seasonSelect.value;
            const url = new URL(window.location.href);

            if (selectedSeason && selectedSeason !== 'all') {
                url.searchParams.set('season', selectedSeason);
            } else {
                url.searchParams.delete('season');
            }
            
            window.location.href = url.toString();
        });
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
    const loadingEl = document.getElementById('trains-loading');
    const errorEl = document.getElementById('trains-error');

    if (!listEl || !templateEl) {
        return;
    }

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
    hookRegionSorter();
    hookSeasonSorter();
    hookTripScheduleFilters();
    hookTrainsCatalog();
});