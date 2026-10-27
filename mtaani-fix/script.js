(function () {
    'use strict';

    const categoryLabels = {
        garbage: 'Waste & litter',
        roads: 'Roads & paths',
        streetlights: 'Streetlights',
        water: 'Water & drainage',
        sanitation: 'Clean & safe spaces',
        environment: 'Green spaces & environment'
    };
    const categorySymbols = {
        garbage: '♻',
        roads: '⌁',
        streetlights: '☼',
        water: '≈',
        sanitation: '✳',
        environment: '⌘'
    };
    const reportStatuses = {
        reported: { label: 'Just reported', className: 'status-reported' },
        progress: { label: 'Being worked on', className: 'status-progress' },
        solved: { label: 'Resolved', className: 'status-solved' }
    };
    const reportPriorities = {
        low: 'Low',
        medium: 'Medium',
        high: 'High',
        urgent: 'Urgent'
    };

    let csrfToken = '';
    let currentUser = null;
    let registrationEnabled = true;

    function pageHref(fileName) {
        return window.location.pathname.includes('/pages/') ? fileName : 'pages/' + fileName;
    }

    async function apiRequest(url, options) {
        const requestOptions = options || {};
        const method = requestOptions.method || 'GET';
        const headers = { Accept: 'application/json' };
        if (requestOptions.body !== undefined) {
            headers['Content-Type'] = 'application/json';
        }
        if (method !== 'GET' && method !== 'HEAD') {
            headers['X-CSRF-Token'] = csrfToken;
        }

        const response = await fetch(url, {
            method: method,
            credentials: 'same-origin',
            headers: headers,
            body: requestOptions.body === undefined ? undefined : JSON.stringify(requestOptions.body)
        });
        let result;
        try {
            result = await response.json();
        } catch (error) {
            throw new Error('The server returned an unreadable response. Please try again.');
        }
        if (result && typeof result.csrfToken === 'string') {
            csrfToken = result.csrfToken;
        }
        if (!response.ok) {
            const apiError = new Error(result && result.error ? result.error : 'The request could not be completed.');
            apiError.status = response.status;
            throw apiError;
        }
        return result;
    }

    function createTextElement(tagName, className, text) {
        const element = document.createElement(tagName);
        if (className) {
            element.className = className;
        }
        element.textContent = text;
        return element;
    }

    function filesToEvidence(files) {
        return Promise.all(files.map(function (file) {
            return new Promise(function (resolve, reject) {
                const reader = new FileReader();
                reader.onload = function () { resolve({ dataUrl: reader.result }); };
                reader.onerror = function () { reject(new Error('A selected photo could not be read. Please choose it again.')); };
                reader.readAsDataURL(file);
            });
        }));
    }

    async function showReportDetails(reportId) {
        const dialog = document.querySelector('#report-details-dialog');
        const title = document.querySelector('#report-details-title');
        const feedback = document.querySelector('#report-details-feedback');
        const content = document.querySelector('#report-details-content');
        if (!dialog || !title || !content) {
            return;
        }
        title.textContent = reportId;
        content.replaceChildren();
        feedback.textContent = 'Loading report updates…';
        if (!dialog.open) {
            dialog.showModal();
        }
        try {
            const details = await apiRequest('/api/reports/' + encodeURIComponent(reportId) + '/details');
            content.replaceChildren();
            feedback.textContent = 'Priority: ' + (reportPriorities[details.priority] || 'Medium');
            if (details.milestones) {
                const milestones = document.createElement('section');
                milestones.className = 'report-milestones';
                milestones.append(
                    createTextElement('h3', '', 'Key dates'),
                    createTextElement('p', '', 'Submitted: ' + formatDate(details.milestones.submittedAt)),
                    createTextElement(
                        'p',
                        '',
                        'First reviewed: ' + (details.milestones.reviewedAt ? formatDate(details.milestones.reviewedAt) : 'Awaiting review')
                    ),
                    createTextElement(
                        'p',
                        '',
                        'Solved: ' + (details.milestones.solvedAt ? formatDate(details.milestones.solvedAt) : 'Not yet solved')
                    ),
                    createTextElement(
                        'p',
                        '',
                        'Resident confirmation: ' + (details.confirmations.yes
                            ? details.confirmations.yes + ' resident' + (details.confirmations.yes === 1 ? '' : 's') + ' confirmed fixed'
                            : 'Not confirmed yet')
                    )
                );
                content.append(milestones);
            }
            if (details.location && details.location.latitude !== null && details.location.longitude !== null) {
                content.append(createTextElement(
                    'p',
                    'report-private-location',
                    'Exact location (visible only to you and the assigned administrator): ' +
                        details.location.latitude.toFixed(5) + ', ' + details.location.longitude.toFixed(5)
                ));
            }

            const evidenceSection = document.createElement('section');
            evidenceSection.append(createTextElement('h3', '', 'Before → after evidence'));
            ['before', 'after'].forEach(function (evidenceType) {
                const photos = details.evidence.filter(function (photo) {
                    return (photo.evidenceType || 'before') === evidenceType;
                });
                const evidenceGroup = document.createElement('section');
                evidenceGroup.append(createTextElement('h4', '', evidenceType === 'before' ? 'Before' : 'After'));
                if (photos.length === 0) {
                    evidenceGroup.append(createTextElement(
                        'p',
                        '',
                        evidenceType === 'before' ? 'No report photos were attached.' : 'No completion photos have been added yet.'
                    ));
                } else {
                    const evidenceGrid = document.createElement('div');
                    evidenceGrid.className = 'report-evidence-grid';
                    photos.forEach(function (photo) {
                        const image = document.createElement('img');
                        image.src = photo.dataUrl;
                        image.alt = (evidenceType === 'before' ? 'Before' : 'After') + ' photo for report ' + reportId;
                        evidenceGrid.append(image);
                    });
                    evidenceGroup.append(evidenceGrid);
                }
                evidenceSection.append(evidenceGroup);
            });
            if (details.canManageEvidence) {
                const afterForm = document.createElement('form');
                afterForm.className = 'after-evidence-form';
                const afterLabel = createTextElement('label', '', 'Add completion photos');
                afterLabel.htmlFor = 'after-evidence-' + reportId.replace(/[^A-Za-z0-9_-]/g, '-');
                const afterInput = document.createElement('input');
                afterInput.id = afterLabel.htmlFor;
                afterInput.type = 'file';
                afterInput.accept = 'image/jpeg,image/png,image/webp';
                afterInput.multiple = true;
                afterInput.setAttribute('aria-label', 'Completion photos');
                const afterSubmit = createTextElement('button', 'button button-secondary', 'Upload after photos');
                afterSubmit.type = 'submit';
                afterForm.append(afterLabel, afterInput, afterSubmit);
                afterForm.addEventListener('submit', async function (event) {
                    event.preventDefault();
                    const files = Array.from(afterInput.files || []);
                    if (files.length === 0 || files.length > 3 || files.some(function (file) { return file.size > 1500000; })) {
                        feedback.textContent = 'Choose up to three completion photos, each no larger than 1.5 MB.';
                        return;
                    }
                    afterSubmit.disabled = true;
                    try {
                        await apiRequest('/api/admin/reports/' + encodeURIComponent(reportId) + '/evidence', {
                            method: 'POST',
                            body: { evidence: await filesToEvidence(files) }
                        });
                        await showReportDetails(reportId);
                    } catch (error) {
                        feedback.textContent = error.message;
                    } finally {
                        afterSubmit.disabled = false;
                    }
                });
                evidenceSection.append(afterForm);
            }
            content.append(evidenceSection);

            const timeline = document.createElement('section');
            timeline.append(createTextElement('h3', '', 'Status timeline'));
            const timelineList = document.createElement('ol');
            timelineList.className = 'report-timeline';
            details.history.forEach(function (entry) {
                const item = document.createElement('li');
                const status = reportStatuses[entry.status] || reportStatuses.reported;
                item.append(
                    createTextElement('strong', '', status.label),
                    createTextElement('span', '', formatDate(entry.created_at)),
                    createTextElement('small', 'report-history-actor', 'By ' + (entry.actor || 'MtaaFix')),
                    entry.note ? createTextElement('p', '', entry.note) : document.createTextNode('')
                );
                timelineList.append(item);
            });
            timeline.append(timelineList);
            content.append(timeline);

            if (details.status === 'solved' && details.canConfirm) {
                const confirmation = document.createElement('section');
                confirmation.append(
                    createTextElement('h3', '', 'Was this problem fixed?'),
                    createTextElement(
                        'p',
                        'report-confirmation-counts',
                        'Yes: ' + details.confirmations.yes + ' · Not yet: ' + details.confirmations.no
                    )
                );
                ['yes', 'no'].forEach(function (answer) {
                    const button = createTextElement(
                        'button',
                        'button button-small ' + (details.confirmations.vote === (answer === 'yes') ? 'button-primary' : 'button-secondary'),
                        answer === 'yes' ? '👍 Yes' : '👎 Not yet'
                    );
                    button.type = 'button';
                    button.addEventListener('click', async function () {
                        button.disabled = true;
                        try {
                            const result = await apiRequest('/api/reports/' + encodeURIComponent(reportId) + '/confirmation', {
                                method: 'POST',
                                body: { solved: answer === 'yes' }
                            });
                            details.confirmations = result.confirmations;
                            await showReportDetails(reportId);
                        } catch (error) {
                            feedback.textContent = error.message;
                        } finally {
                            button.disabled = false;
                        }
                    });
                    confirmation.append(button);
                });
                content.append(confirmation);
            }

            const communitySupport = document.createElement('section');
            communitySupport.className = 'report-community-support';
            communitySupport.append(
                createTextElement('h3', '', 'Community support'),
                createTextElement('p', '', details.supportCount + ' residents affected')
            );
            if (details.canSupport) {
                const supportButton = createTextElement(
                    'button',
                    'button button-small button-secondary',
                    details.supportedByMe ? '✓ Remove my support' : '👍 Support this report'
                );
                supportButton.type = 'button';
                supportButton.addEventListener('click', async function () {
                    supportButton.disabled = true;
                    try {
                        await apiRequest('/api/reports/' + encodeURIComponent(reportId) + '/support', {
                            method: 'POST',
                            body: { supported: !details.supportedByMe }
                        });
                        await showReportDetails(reportId);
                    } catch (error) {
                        feedback.textContent = error.message;
                    } finally {
                        supportButton.disabled = false;
                    }
                });
                communitySupport.append(supportButton);
            }
            content.append(communitySupport);

            if (details.canFlag) {
                const flagSection = document.createElement('section');
                flagSection.className = 'report-flag-section';
                flagSection.append(createTextElement('h3', '', 'Report a concern'));
                if (details.myFlag) {
                    flagSection.append(createTextElement(
                        'p',
                        '',
                        'Your ' + details.myFlag.reason + ' flag is ' + details.myFlag.status + ' and visible to your local administrator.'
                    ));
                } else {
                    const flagForm = document.createElement('form');
                    flagForm.className = 'report-flag-form';
                    const reason = document.createElement('select');
                    reason.setAttribute('aria-label', 'Reason for flagging this report');
                    [
                        ['', 'Choose a reason'],
                        ['fake', 'Fake report'],
                        ['spam', 'Spam'],
                        ['inappropriate', 'Inappropriate content'],
                        ['duplicate', 'Duplicate report']
                    ].forEach(function (choice) {
                        const option = document.createElement('option');
                        option.value = choice[0];
                        option.textContent = choice[1];
                        reason.append(option);
                    });
                    reason.required = true;
                    const detailsInput = document.createElement('textarea');
                    detailsInput.maxLength = 300;
                    detailsInput.rows = 2;
                    detailsInput.placeholder = 'Optional details or the ID of a possible duplicate';
                    detailsInput.setAttribute('aria-label', 'Optional details for your report flag');
                    const flagSubmit = createTextElement('button', 'button button-small button-secondary', 'Send flag to local admin');
                    flagSubmit.type = 'submit';
                    flagForm.append(reason, detailsInput, flagSubmit);
                    flagForm.addEventListener('submit', async function (event) {
                        event.preventDefault();
                        flagSubmit.disabled = true;
                        try {
                            await apiRequest('/api/reports/' + encodeURIComponent(reportId) + '/flags', {
                                method: 'POST',
                                body: { reason: reason.value, details: detailsInput.value.trim() }
                            });
                            await showReportDetails(reportId);
                        } catch (error) {
                            feedback.textContent = error.message;
                        } finally {
                            flagSubmit.disabled = false;
                        }
                    });
                    flagSection.append(flagForm);
                }
                content.append(flagSection);
            }

            const conversation = document.createElement('section');
            conversation.append(createTextElement('h3', '', 'Resident and administrator messages'));
            if (details.messages.length === 0) {
                conversation.append(createTextElement('p', '', 'No private messages yet.'));
            } else {
                const messages = document.createElement('div');
                messages.className = 'report-message-list';
                details.messages.forEach(function (message) {
                    const item = document.createElement('article');
                    item.append(
                        createTextElement('strong', '', message.sender + (message.verifiedAdministrator ? ' ✓' : '')),
                        createTextElement('p', '', message.body),
                        createTextElement('small', '', formatDate(message.createdAt))
                    );
                    messages.append(item);
                });
                conversation.append(messages);
            }
            if (details.canMessage) {
                const messageForm = document.createElement('form');
                messageForm.className = 'report-message-form';
                const messageInput = document.createElement('textarea');
                messageInput.maxLength = 600;
                messageInput.required = true;
                messageInput.rows = 3;
                messageInput.setAttribute('aria-label', 'Message the resident or administrator');
                messageInput.placeholder = 'Write a clear update or question…';
                const submit = createTextElement('button', 'button button-primary', 'Send message');
                submit.type = 'submit';
                messageForm.append(messageInput, submit);
                messageForm.addEventListener('submit', async function (event) {
                    event.preventDefault();
                    submit.disabled = true;
                    try {
                        await apiRequest('/api/reports/' + encodeURIComponent(reportId) + '/messages', {
                            method: 'POST',
                            body: { body: messageInput.value.trim() }
                        });
                        await showReportDetails(reportId);
                    } catch (error) {
                        feedback.textContent = error.message;
                    } finally {
                        submit.disabled = false;
                    }
                });
                conversation.append(messageForm);
            } else {
                conversation.append(createTextElement('p', '', 'Private conversation is visible only to the person who reported the issue and its assigned administrator.'));
            }
            content.append(conversation);
        } catch (error) {
            feedback.textContent = error.message;
        }
    }

    function setupLocationFields(containerId, feedbackId, locationIdSelector) {
        const container = document.querySelector(containerId);
        if (!container) {
            return Promise.resolve();
        }

        const form = container.closest('form');
        const feedback = document.querySelector(feedbackId);
        const locationId = document.querySelector(locationIdSelector);
        const submitButton = form.querySelector('[type="submit"]');
        const selectors = [];
        let levels = [];
        submitButton.disabled = true;

        function setFeedback(message, isError) {
            feedback.textContent = message;
            feedback.classList.toggle('is-error', Boolean(isError));
        }

        function resetSelector(index) {
            const selector = selectors[index];
            selector.replaceChildren();
            const placeholder = createTextElement('option', '', 'Choose a ' + levels[index].label.toLowerCase());
            placeholder.value = '';
            selector.append(placeholder);
            selector.value = '';
            selector.disabled = index > 0;
        }

        async function loadUnits(index, parentId) {
            const selector = selectors[index];
            resetSelector(index);
            selector.disabled = true;
            const params = new URLSearchParams({ levelKey: levels[index].key });
            if (parentId !== null) {
                params.set('parentId', String(parentId));
            }
            try {
                const result = await apiRequest('/api/locations/units?' + params.toString());
                if (index > 0 && selectors[index - 1].value !== String(parentId)) {
                    return false;
                }
                result.units.forEach(function (unit) {
                    const option = createTextElement('option', '', unit.name);
                    option.value = String(unit.id);
                    selector.append(option);
                });
                selector.disabled = false;
                if (result.units.length === 0) {
                    setFeedback('No locations are available at this level yet.', true);
                } else {
                    setFeedback('Choose each level from the list to connect your account to the right local area.', false);
                }
                return result.units.length > 0;
            } catch (error) {
                selector.disabled = true;
                setFeedback(error.message + ' Please refresh and try again.', true);
                return false;
            }
        }

        return apiRequest('/api/locations/levels')
            .then(function (result) {
                if (!result.available) {
                    setFeedback('Registration will open once the verified Kenya county, sub-county and ward catalog is installed.', false);
                    return;
                }
                levels = result.levels;
                if (levels.length === 0) {
                    throw new Error('Kenya location levels are not configured yet.');
                }
                levels.forEach(function (level, index) {
                    const group = document.createElement('div');
                    group.className = 'form-group location-select-group';
                    const label = createTextElement('label', '', level.label);
                    const selector = document.createElement('select');
                    selector.id = 'registration-location-' + index;
                    selector.required = true;
                    selector.disabled = index > 0;
                    const placeholder = createTextElement('option', '', 'Choose a ' + level.label.toLowerCase());
                    placeholder.value = '';
                    selector.append(placeholder);
                    label.htmlFor = selector.id;
                    group.append(label, selector);
                    container.append(group);
                    selectors.push(selector);

                    selector.addEventListener('change', function () {
                        locationId.value = '';
                        submitButton.disabled = true;
                        for (let childIndex = index + 1; childIndex < selectors.length; childIndex += 1) {
                            resetSelector(childIndex);
                        }
                        if (!selector.value) {
                            return;
                        }
                        if (index === levels.length - 1) {
                            locationId.value = selector.value;
                            submitButton.disabled = false;
                            return;
                        }
                        loadUnits(index + 1, Number(selector.value));
                    });
                });
                return loadUnits(0, null);
            })
            .catch(function (error) {
                setFeedback(error.message, true);
            });
    }

    function createAnnouncementCard(announcement) {
        const card = document.createElement('article');
        card.className = 'announcement-card';
        card.append(
            createTextElement('h3', '', announcement.title),
            createTextElement('p', 'announcement-message', announcement.body),
            createTextElement(
                'p',
                'announcement-meta',
                [announcement.locationPath, formatDate(announcement.createdAt)].filter(Boolean).join(' · ')
            )
        );
        return card;
    }

    function formatDate(value) {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return 'Recently';
        }
        return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date);
    }

    function renderAuthNavigation() {
        const isAdmin = currentUser?.role === 'admin';
        document.querySelectorAll('.admin-dashboard-link').forEach(function (link) {
            link.hidden = !isAdmin;
        });

        const nav = document.querySelector('.site-nav');
        if (!nav) {
            return;
        }

        nav.querySelector('.nav-user')?.remove();
        nav.querySelector('.nav-logout')?.remove();
        nav.querySelector('.nav-admin')?.remove();
        nav.querySelector('.nav-profile')?.remove();
        nav.querySelector('.nav-notifications')?.remove();

        const loginLink = Array.from(nav.querySelectorAll('a')).find(function (link) {
            return /(?:^|\/)login\.html$/.test(link.getAttribute('href'));
        });
        const registerLink = Array.from(nav.querySelectorAll('a')).find(function (link) {
            return /(?:^|\/)register\.html$/.test(link.getAttribute('href'));
        });

        if (!registrationEnabled) {
            document.querySelectorAll('a[href$="register.html"]').forEach(function (link) {
                link.hidden = true;
            });
        }

        if (!currentUser) {
            if (loginLink) {
                loginLink.hidden = false;
            }
            if (registerLink) registerLink.hidden = !registrationEnabled;
            return;
        }

        if (loginLink) {
            loginLink.hidden = true;
        }
        if (registerLink) {
            registerLink.hidden = true;
        }

        const profileLink = createTextElement('a', 'nav-link nav-profile', 'My profile');
        profileLink.href = pageHref('profile.html');
        const notificationsLink = createTextElement(
            'a',
            'nav-link nav-notifications',
            'Notifications' + (currentUser.unreadNotifications ? ' (' + currentUser.unreadNotifications + ')' : '')
        );
        notificationsLink.href = pageHref('notifications.html');
        const greeting = createTextElement('span', 'nav-user', 'Hi, ' + currentUser.name);
        nav.append(greeting);
        nav.append(profileLink, notificationsLink);

        if (currentUser.role === 'admin') {
            const adminLink = createTextElement('a', 'nav-link nav-admin', 'Dashboard');
            adminLink.href = pageHref('admin.html');
            nav.append(adminLink);
        }

        const logoutButton = createTextElement('button', 'nav-link nav-logout', 'Sign out');
        logoutButton.type = 'button';
        logoutButton.addEventListener('click', async function () {
            logoutButton.disabled = true;
            try {
                await apiRequest('/api/auth/logout', { method: 'POST', body: {} });
                currentUser = null;
                window.location.href = pageHref('login.html');
            } catch (error) {
                logoutButton.disabled = false;
                window.alert(error.message);
            }
        });
        nav.append(logoutButton);
    }

    function addStatus(card, statusKey) {
        const status = reportStatuses[statusKey] || reportStatuses.reported;
        const statusElement = document.createElement('span');
        statusElement.className = 'status ' + status.className;
        const dot = document.createElement('i');
        dot.setAttribute('aria-hidden', 'true');
        statusElement.append(dot, document.createTextNode(' ' + status.label));
        card.append(statusElement);
    }

    function createReportCard(report) {
        const card = document.createElement('article');
        card.className = 'report-card';
        card.dataset.status = reportStatuses[report.status] ? report.status : 'reported';

        const top = document.createElement('div');
        top.className = 'report-card-top';
        const category = document.createElement('span');
        category.className = 'category-label';
        const symbol = createTextElement('span', '', categorySymbols[report.category] || '•');
        symbol.setAttribute('aria-hidden', 'true');
        category.append(symbol, document.createTextNode(' ' + (categoryLabels[report.category] || 'Community issue')));
        top.append(category);
        addStatus(top, report.status);
        top.append(createTextElement(
            'span',
            'report-priority report-priority-' + (report.priority || 'medium'),
            (reportPriorities[report.priority] || 'Medium') + ' priority'
        ));

        const title = createTextElement('h2', '', report.title);
        const location = createTextElement('p', 'report-location', '⌖ ' + report.location);
        const description = createTextElement('p', 'report-card-description', report.description);
        const bottom = document.createElement('div');
        bottom.className = 'report-card-bottom';
        bottom.append(
            createTextElement('span', '', 'Shared by a neighbour · ' + formatDate(report.createdAt)),
            createTextElement('span', '', report.id)
        );
        const detailsButton = createTextElement('button', 'report-details-button', 'Timeline, evidence & updates');
        detailsButton.type = 'button';
        detailsButton.addEventListener('click', function () { showReportDetails(report.id); });
        const supportButton = createTextElement(
            'button',
            'report-support-button',
            '👍 ' + (report.supportCount || 0) + ' residents affected' +
                (report.supportedByMe ? ' · Supported' : '')
        );
        supportButton.type = 'button';
        supportButton.setAttribute('aria-pressed', String(Boolean(report.supportedByMe)));
        if (!report.canSupport) {
            supportButton.disabled = true;
            supportButton.title = currentUser && currentUser.role === 'user'
                ? 'Only neighbours in the report area can support it'
                : 'Sign in as a resident to support this report';
        }
        supportButton.addEventListener('click', async function () {
            if (!report.canSupport) {
                return;
            }
            supportButton.disabled = true;
            try {
                const supported = !report.supportedByMe;
                const result = await apiRequest('/api/reports/' + encodeURIComponent(report.id) + '/support', {
                    method: 'POST',
                    body: { supported: supported }
                });
                report.supportedByMe = result.supported;
                report.supportCount = result.supportCount;
                supportButton.textContent = '👍 ' + result.supportCount + ' residents affected' +
                    (result.supported ? ' · Supported' : '');
                supportButton.setAttribute('aria-pressed', String(result.supported));
            } catch (error) {
                const boardFeedback = document.querySelector('#board-feedback');
                if (boardFeedback) {
                    boardFeedback.classList.add('is-error');
                    boardFeedback.textContent = error.message;
                }
            } finally {
                supportButton.disabled = false;
            }
        });
        card.append(top, title, location, description, bottom, supportButton, detailsButton);
        return card;
    }

    function setupBoard() {
        const grid = document.querySelector('#reports-grid');
        if (!grid) {
            return;
        }

        const feedback = document.querySelector('#board-feedback');
        const search = document.querySelector('#report-search');
        const categoryFilter = document.querySelector('#report-category-filter');
        const priorityFilter = document.querySelector('#report-priority-filter');
        const dateFrom = document.querySelector('#report-date-from');
        const dateTo = document.querySelector('#report-date-to');
        const filters = Array.from(document.querySelectorAll('[data-filter]'));
        const count = document.querySelector('#results-count');
        const emptyState = document.querySelector('#empty-state');
        const emptyTitle = emptyState.querySelector('strong');
        const emptyDescription = emptyState.querySelector('span');
        const emptyLink = emptyState.querySelector('a');
        let activeFilter = 'all';
        let reports = [];

        function updateResults() {
            const searchTerm = search.value.trim().toLocaleLowerCase();
            const visibleReports = reports.filter(function (report) {
                const matchesFilter = activeFilter === 'all' || report.status === activeFilter;
                const searchableText = [
                    report.title,
                    report.category,
                    categoryLabels[report.category],
                    report.description,
                    report.location,
                    (report.locationPath || []).map(function (level) { return level.name; }).join(' '),
                    report.id,
                    report.status,
                    (reportStatuses[report.status] || {}).label,
                    report.priority,
                    reportPriorities[report.priority],
                    report.createdAt
                ].join(' ').toLocaleLowerCase();
                const reportDate = String(report.createdAt).slice(0, 10);
                return matchesFilter &&
                    searchableText.includes(searchTerm) &&
                    (!categoryFilter.value || report.category === categoryFilter.value) &&
                    (!priorityFilter.value || report.priority === priorityFilter.value) &&
                    (!dateFrom.value || reportDate >= dateFrom.value) &&
                    (!dateTo.value || reportDate <= dateTo.value);
            });

            grid.replaceChildren.apply(grid, visibleReports.map(createReportCard));
            count.textContent = visibleReports.length + (visibleReports.length === 1 ? ' update' : ' updates') + ' on the board';
            emptyState.hidden = visibleReports.length !== 0;
            if (reports.length === 0) {
                emptyTitle.textContent = 'No neighbourhood reports yet';
                emptyDescription.textContent = currentUser
                    ? 'Be the first to share something your neighbours should know about.'
                    : 'Sign in to share something your neighbours should know about.';
                emptyLink.href = currentUser ? 'report.html' : 'login.html';
                emptyLink.textContent = currentUser ? 'Share the first report →' : 'Sign in to get started →';
                return;
            }

            emptyTitle.textContent = 'No reports match those filters';
            emptyDescription.textContent = 'Try another search or choose a different status.';
            emptyLink.href = 'reports.html';
            emptyLink.textContent = 'Clear search and filters';
        }

        filters.forEach(function (button) {
            button.addEventListener('click', function () {
                activeFilter = button.dataset.filter;
                filters.forEach(function (filterButton) {
                    const isSelected = filterButton === button;
                    filterButton.classList.toggle('is-selected', isSelected);
                    filterButton.setAttribute('aria-pressed', String(isSelected));
                });
                updateResults();
            });
        });

        emptyLink.addEventListener('click', function (event) {
            if (emptyLink.getAttribute('href') !== 'reports.html') {
                return;
            }
            event.preventDefault();
            search.value = '';
            categoryFilter.value = '';
            priorityFilter.value = '';
            dateFrom.value = '';
            dateTo.value = '';
            const allButton = filters.find(function (button) {
                return button.dataset.filter === 'all';
            });
            if (allButton) {
                allButton.click();
            }
        });

        search.addEventListener('input', updateResults);
        [categoryFilter, priorityFilter, dateFrom, dateTo].forEach(function (control) {
            control.addEventListener('change', updateResults);
        });
        if (currentUser && document.querySelector('#community-statistics-title')) {
            apiRequest('/api/community/statistics')
                .then(function (result) {
                    document.querySelector('#community-statistics-area').textContent = result.area;
                    document.querySelector('#community-statistics-reports').textContent = String(result.totals.reports);
                    document.querySelector('#community-statistics-solved').textContent = String(result.totals.solved);
                    document.querySelector('#community-statistics-progress').textContent = String(result.totals.inProgress);
                    document.querySelector('#community-statistics-reported').textContent = String(result.totals.reported);
                })
                .catch(function (error) {
                    document.querySelector('#community-statistics-area').textContent = error.message;
                });
        } else if (document.querySelector('#community-statistics-title')) {
            document.querySelector('#community-statistics-area').textContent = 'Sign in to see reports from your neighbourhood.';
        }
        apiRequest('/api/reports')
            .then(function (result) {
                reports = result.reports;
                updateResults();
            })
            .catch(function (error) {
                feedback.classList.add('is-error');
                feedback.textContent = error.message + ' Make sure the MtaaFix server is running.';
            });
    }

    function showSignInMessage(feedback) {
        feedback.replaceChildren(
            document.createTextNode('Please sign in before sharing an issue. '),
            (function () {
                const link = document.createElement('a');
                link.href = 'login.html';
                link.textContent = 'Sign in';
                return link;
            }())
        );
    }

    function updateReportFormAccess() {
        const form = document.querySelector('#report-form');
        const loginRequired = document.querySelector('#report-login-required');
        const locationSetupForm = document.querySelector('#location-setup');
        if (!form || !loginRequired || !locationSetupForm) {
            return;
        }
        form.hidden = !currentUser || !currentUser.location;
        loginRequired.hidden = Boolean(currentUser);
        locationSetupForm.hidden = !currentUser || Boolean(currentUser.location);
        const areaSummary = document.querySelector('#report-area-summary');
        if (areaSummary) {
            const location = currentUser?.location;
            areaSummary.textContent = location
                ? 'This report will be shared with ' + location.path.map(function (level) { return level.name; }).join(' › ') + '.'
                : 'Your account needs an administrative location before you can share a report.';
        }
    }

    function setupReportForm() {
        const form = document.querySelector('#report-form');
        if (!form) {
            return;
        }

        const feedback = document.querySelector('#form-feedback');
        const categorySelect = form.elements.namedItem('category');
        const requestedCategory = new URLSearchParams(window.location.search).get('category');
        const locationButton = document.querySelector('#capture-location');
        const locationFeedback = document.querySelector('#exact-location-feedback');
        if (locationButton && locationFeedback) {
            locationButton.addEventListener('click', function () {
                if (!navigator.geolocation) {
                    locationFeedback.textContent = 'Your browser does not support location sharing.';
                    return;
                }
                locationButton.disabled = true;
                locationFeedback.textContent = 'Waiting for your permission to use your location…';
                navigator.geolocation.getCurrentPosition(function (position) {
                    form.dataset.latitude = String(position.coords.latitude);
                    form.dataset.longitude = String(position.coords.longitude);
                    locationFeedback.textContent = 'Exact location added. It is visible only to you and the assigned administrator.';
                    locationButton.disabled = false;
                }, function () {
                    locationFeedback.textContent = 'Location was not shared. You can still submit the report without coordinates.';
                    locationButton.disabled = false;
                }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 });
            });
        }
        if (requestedCategory && Object.prototype.hasOwnProperty.call(categoryLabels, requestedCategory)) {
            categorySelect.value = requestedCategory;
        }

        form.addEventListener('submit', async function (event) {
            event.preventDefault();
            feedback.replaceChildren();
            feedback.classList.remove('is-error');

            if (!currentUser) {
                showSignInMessage(feedback);
                return;
            }

            const formData = new FormData(form);
            const files = Array.from(form.elements.namedItem('evidence').files || []);
            if (files.length > 3 || files.some(function (file) { return file.size > 1500000; })) {
                feedback.classList.add('is-error');
                feedback.textContent = 'Attach up to three photos, each no larger than 1.5 MB.';
                return;
            }
            let evidence;
            try {
                evidence = await filesToEvidence(files);
            } catch (error) {
                feedback.classList.add('is-error');
                feedback.textContent = error.message;
                return;
            }
            const report = {
                title: formData.get('title').trim(),
                category: formData.get('category'),
                description: formData.get('description').trim(),
                location: formData.get('location').trim(),
                priority: formData.get('priority'),
                latitude: form.dataset.latitude ? Number(form.dataset.latitude) : null,
                longitude: form.dataset.longitude ? Number(form.dataset.longitude) : null,
                evidence: evidence
            };

            try {
                const result = await apiRequest('/api/reports', { method: 'POST', body: report });
                form.reset();
                delete form.dataset.latitude;
                delete form.dataset.longitude;
                if (locationFeedback) {
                    locationFeedback.textContent = 'Optional. Your coordinates are visible only to you and the assigned administrator.';
                }
                feedback.append(
                    document.createTextNode('Thanks for looking out for your neighbours. Your report ' + result.report.id + ' is now shared with the community. '),
                    (function () {
                        const link = document.createElement('a');
                        link.href = 'reports.html';
                        link.textContent = 'See it on the community board.';
                        return link;
                    }())
                );
            } catch (error) {
                feedback.classList.add('is-error');
                if (error.status === 401) {
                    showSignInMessage(feedback);
                } else {
                    feedback.textContent = error.message;
                }
            }
        });
    }

    function setupProfileLocationForm() {
        const form = document.querySelector('#profile-location-form');
        if (!form) {
            return;
        }
        const feedback = document.querySelector('#profile-location-feedback');
        const submitButton = form.querySelector('[type="submit"]');
        form.addEventListener('submit', async function (event) {
            event.preventDefault();
            feedback.classList.remove('is-error');
            feedback.textContent = '';
            const formData = new FormData(form);
            const locationUnitId = Number(formData.get('locationUnitId'));
            if (!locationUnitId) {
                feedback.classList.add('is-error');
                feedback.textContent = 'Choose your county, sub-county, and ward before saving.';
                return;
            }
            submitButton.disabled = true;
            try {
                await Promise.all([sessionReady, locationSetup]);
                const result = await apiRequest('/api/auth/location', {
                    method: 'PATCH',
                    body: {
                        locationUnitId: locationUnitId,
                        area: formData.get('area').trim()
                    }
                });
                currentUser = result.user;
                renderAuthNavigation();
                if (feedback) {
                    feedback.classList.remove('is-error');
                    feedback.textContent = 'Your neighbourhood is saved.';
                }
                const currentArea = document.querySelector('#profile-current-area');
                if (currentArea && result.user.location) {
                    currentArea.textContent =
                        result.user.location.path.map(function (level) { return level.name; }).join(' › ') +
                        (result.user.location.area ? ' · ' + result.user.location.area : '');
                }
                const reportFeedback = document.querySelector('#form-feedback');
                if (reportFeedback) {
                    reportFeedback.classList.remove('is-error');
                    reportFeedback.textContent = 'Your neighbourhood is saved. You can now share updates with the right local team.';
                }
                updateReportFormAccess();
            } catch (error) {
                feedback.classList.add('is-error');
                feedback.textContent = error.message;
            } finally {
                submitButton.disabled = false;
            }
        });
    }

    function setupProfilePage() {
        const form = document.querySelector('#profile-form');
        const reportsList = document.querySelector('#profile-reports');
        if (!form || !reportsList) {
            return;
        }
        const feedback = document.querySelector('#profile-feedback');
        const adminDetails = document.querySelector('#profile-admin-details');
        const accessNotice = document.querySelector('#profile-access-notice');
        const reportsEmpty = document.querySelector('#profile-reports-empty');

        if (!currentUser) {
            accessNotice.hidden = false;
            accessNotice.textContent = 'Sign in to view and update your profile.';
            form.hidden = true;
            reportsList.hidden = true;
            reportsEmpty.hidden = false;
            reportsEmpty.textContent = 'Sign in to see reports you have shared.';
            return;
        }

        form.elements.namedItem('name').value = currentUser.name;
        form.elements.namedItem('phone').value = currentUser.phone || '';
        document.querySelector('#profile-email').textContent = currentUser.email;
        document.querySelector('#profile-area').value = currentUser.location?.area || '';
        document.querySelector('#profile-current-area').textContent = currentUser.location
            ? currentUser.location.path.map(function (level) { return level.name; }).join(' › ') +
              (currentUser.location.area ? ' · ' + currentUser.location.area : '')
            : 'No neighbourhood is connected to your account yet.';
        form.hidden = false;
        reportsList.hidden = false;
        accessNotice.hidden = true;
        if (currentUser.role === 'admin' && currentUser.administrativeArea) {
            adminDetails.hidden = false;
            document.querySelector('#profile-admin-title').textContent = currentUser.administrativeArea.title;
            document.querySelector('#profile-admin-area').textContent =
                currentUser.administrativeArea.path.map(function (level) { return level.name; }).join(' › ');
            document.querySelector('#profile-admin-approval').textContent =
                'Approved by ' + currentUser.administrativeArea.approvedBy + ' on ' +
                formatDate(currentUser.administrativeArea.approvedAt) + '.';
            apiRequest('/api/admin/reports')
                .then(function (result) {
                    document.querySelector('#profile-admin-metrics').textContent =
                        result.counts.total + ' reports · ' + result.counts.reported + ' new · ' +
                        result.counts.progress + ' in progress · ' + result.counts.solved + ' resolved.';
                })
                .catch(function (error) {
                    document.querySelector('#profile-admin-metrics').textContent = error.message;
                });
        } else if (currentUser.role === 'admin') {
            accessNotice.hidden = false;
            accessNotice.textContent = 'Your administrator request does not have a current, trusted operator approval.';
        }

        form.addEventListener('submit', async function (event) {
            event.preventDefault();
            feedback.classList.remove('is-error');
            feedback.textContent = '';
            const button = form.querySelector('[type="submit"]');
            button.disabled = true;
            try {
                const result = await apiRequest('/api/profile', {
                    method: 'PATCH',
                    body: {
                        name: form.elements.namedItem('name').value.trim(),
                        phone: form.elements.namedItem('phone').value.trim()
                    }
                });
                currentUser = result.user;
                renderAuthNavigation();
                feedback.textContent = 'Your profile has been saved.';
            } catch (error) {
                feedback.classList.add('is-error');
                feedback.textContent = error.message;
            } finally {
                button.disabled = false;
            }
        });

        apiRequest('/api/profile')
            .then(function (result) {
                const cards = result.reports.map(createReportCard);
                reportsList.replaceChildren.apply(reportsList, cards);
                document.querySelector('#profile-reports-count').textContent =
                    result.totalReports > cards.length
                        ? 'Showing your latest ' + cards.length + ' of ' + result.totalReports + ' reports.'
                        : result.totalReports + (result.totalReports === 1 ? ' report shared.' : ' reports shared.');
                reportsEmpty.hidden = cards.length !== 0;
                reportsEmpty.textContent = cards.length ? '' : 'You have not shared a neighbourhood report yet.';
            })
            .catch(function (error) {
                reportsEmpty.hidden = false;
                reportsEmpty.textContent = error.message;
            });
    }

    function setupNotificationsPage() {
        const list = document.querySelector('#notification-list');
        if (!list) {
            return;
        }
        const empty = document.querySelector('#notification-empty');
        const feedback = document.querySelector('#notification-feedback');
        if (!currentUser) {
            empty.textContent = 'Sign in to see your neighbourhood notifications.';
            return;
        }

        apiRequest('/api/notifications')
            .then(function (result) {
                const cards = result.notifications.map(function (notification) {
                    const card = document.createElement('article');
                    card.className = 'notification-card' + (notification.readAt ? ' is-read' : '');
                    card.append(
                        createTextElement('p', 'eyebrow', notification.type.replaceAll('_', ' ')),
                        createTextElement('h2', '', notification.title),
                        createTextElement('p', 'notification-message', notification.message),
                        createTextElement('small', '', formatDate(notification.createdAt))
                    );
                    if (!notification.readAt) {
                        const button = createTextElement('button', 'button button-small button-outline', 'Mark as read');
                        button.type = 'button';
                        button.addEventListener('click', async function () {
                            button.disabled = true;
                            try {
                                await apiRequest('/api/notifications/' + notification.id + '/read', {
                                    method: 'PATCH',
                                    body: {}
                                });
                                card.classList.add('is-read');
                                button.remove();
                                currentUser.unreadNotifications = Math.max(0, (currentUser.unreadNotifications || 1) - 1);
                                renderAuthNavigation();
                            } catch (error) {
                                button.disabled = false;
                                feedback.classList.add('is-error');
                                feedback.textContent = error.message;
                            }
                        });
                        card.append(button);
                    }
                    return card;
                });
                list.replaceChildren.apply(list, cards);
                empty.hidden = cards.length !== 0;
                empty.textContent = cards.length ? '' : 'You are all caught up. New updates from your area will appear here.';
            })
            .catch(function (error) {
                empty.hidden = false;
                empty.textContent = error.message;
            });
    }

    function setupAuthForms() {
        document.querySelectorAll('[data-auth-form]').forEach(function (form) {
            form.addEventListener('submit', async function (event) {
                event.preventDefault();
                const feedback = form.querySelector('.auth-feedback');
                const submitButton = form.querySelector('[type="submit"]');
                if (form.dataset.authForm === 'register' && !registrationEnabled) {
                    feedback.classList.add('is-error');
                    feedback.textContent = 'New account registration is temporarily paused while verified location data is prepared.';
                    return;
                }
                feedback.classList.remove('is-error');
                feedback.textContent = '';
                submitButton.disabled = true;

                const formData = new FormData(form);
                const isRegister = form.dataset.authForm === 'register';
                const payload = { email: formData.get('email'), password: formData.get('password') };
                if (isRegister) {
                    payload.name = formData.get('name');
                    payload.phone = formData.get('phone');
                    payload.locationUnitId = Number(formData.get('locationUnitId'));
                    payload.area = formData.get('area').trim();
                    if (!payload.locationUnitId) {
                        feedback.classList.add('is-error');
                        feedback.textContent = 'Choose your county, sub-county, and ward before joining.';
                        submitButton.disabled = false;
                        return;
                    }
                }

                try {
                    await Promise.all([sessionReady, locationSetup]);
                    const result = await apiRequest(isRegister ? '/api/auth/register' : '/api/auth/login', {
                        method: 'POST',
                        body: payload
                    });
                    currentUser = result.user;
                    renderAuthNavigation();
                    feedback.textContent = 'You’re signed in. Taking you to the community board…';
                    window.setTimeout(function () {
                        window.location.href = pageHref(currentUser.role === 'admin' ? 'admin.html' : 'reports.html');
                    }, 650);
                } catch (error) {
                    feedback.classList.add('is-error');
                    feedback.textContent = error.message;
                    submitButton.disabled = false;
                }
            });
        });
    }

    function setupLocalAnnouncements() {
        const list = document.querySelector('#local-announcement-list');
        if (!list) {
            return;
        }
        const emptyState = document.querySelector('#local-announcement-empty');
        if (!currentUser) {
            emptyState.textContent = 'Sign in to see notices for your neighbourhood.';
            return;
        }

        emptyState.textContent = 'Loading notices for your area…';
        apiRequest('/api/announcements')
            .then(function (result) {
                list.replaceChildren.apply(list, result.announcements.map(createAnnouncementCard));
                emptyState.hidden = result.announcements.length !== 0;
                emptyState.textContent = result.announcements.length === 0
                    ? 'There are no local notices yet. Check back for updates from your administrators.'
                    : '';
            })
            .catch(function (error) {
                emptyState.hidden = false;
                emptyState.textContent = error.message;
            });
    }

    function setupAdminDashboard() {
        const reportList = document.querySelector('#admin-report-list');
        if (!reportList) {
            return;
        }

        const feedback = document.querySelector('#admin-feedback');
        const search = document.querySelector('#admin-search');
        const categoryFilter = document.querySelector('#admin-category-filter');
        const priorityFilter = document.querySelector('#admin-priority-filter');
        const statusFilter = document.querySelector('#admin-status-filter');
        const dateFrom = document.querySelector('#admin-date-from');
        const dateTo = document.querySelector('#admin-date-to');
        const emptyState = document.querySelector('#admin-empty');
        const table = document.querySelector('.admin-table');
        const overview = document.querySelector('.admin-overview');
        const panel = document.querySelector('.admin-report-panel');
        const gate = document.querySelector('#admin-access-gate');
        const areaCard = document.querySelector('#admin-area-card');
        const announcementsPanel = document.querySelector('.admin-announcements');
        const announcementForm = document.querySelector('#admin-announcement-form');
        const announcementList = document.querySelector('#admin-announcement-list');
        const announcementEmpty = document.querySelector('#admin-announcement-empty');
        const announcementFeedback = document.querySelector('#admin-announcement-feedback');
        const statisticsPanel = document.querySelector('#admin-statistics');
        const flagsPanel = document.querySelector('.admin-flags');
        const flagList = document.querySelector('#admin-flag-list');
        const flagEmpty = document.querySelector('#admin-flag-empty');
        const flagFeedback = document.querySelector('#admin-flag-feedback');

        function setCounts(counts) {
            document.querySelector('#metric-total').textContent = String(counts.total);
            document.querySelector('#metric-new').textContent = String(counts.reported);
            document.querySelector('#metric-progress').textContent = String(counts.progress);
            document.querySelector('#metric-solved').textContent = String(counts.solved);
            document.querySelector('#metric-residents').textContent = String(counts.residents);
            document.querySelector('#metric-overdue').textContent = String(counts.overdue || 0);
        }

        function renderStatistics(statistics) {
            if (!statisticsPanel) {
                return;
            }
            const categoryList = document.querySelector('#admin-category-stats');
            const priorityList = document.querySelector('#admin-priority-stats');
            const monthlyList = document.querySelector('#admin-month-stats');
            const locationList = document.querySelector('#admin-location-stats');
            const hotspotList = document.querySelector('#admin-hotspot-stats');
            categoryList.replaceChildren.apply(categoryList, statistics.byCategory.map(function (entry) {
                return createTextElement('li', '', (categoryLabels[entry.category] || entry.category) + ': ' + entry.total);
            }));
            priorityList.replaceChildren.apply(priorityList, statistics.byPriority.map(function (entry) {
                return createTextElement('li', '', (reportPriorities[entry.priority] || 'Medium') + ': ' + entry.total);
            }));
            statisticsPanel.hidden = false;
            const monthlyGroups = new Map();
            statistics.byMonth.forEach(function (entry) {
                if (!monthlyGroups.has(entry.month)) {
                    monthlyGroups.set(entry.month, []);
                }
                monthlyGroups.get(entry.month).push(
                    (reportStatuses[entry.status]?.label || entry.status) + ': ' + entry.total
                );
            });
            monthlyList.replaceChildren.apply(monthlyList, Array.from(monthlyGroups.entries()).map(function (entry) {
                return createTextElement('li', '', entry[0] + ' · ' + entry[1].join(' · '));
            }));
            locationList.replaceChildren.apply(locationList, statistics.byLocation.map(function (entry) {
                return createTextElement('li', '', entry.locationPath + ' · ' + entry.area + ': ' + entry.total);
            }));
            hotspotList.replaceChildren.apply(hotspotList, statistics.hotspots.map(function (entry) {
                return createTextElement(
                    'li',
                    '',
                    (categoryLabels[entry.category] || entry.category) + ' hotspot · ' +
                        entry.locationPath + ' · ' + entry.area + ': ' + entry.total
                );
            }));
            if (statistics.hotspots.length === 0) {
                hotspotList.append(createTextElement('li', '', 'No recurring hotspots meet the threshold yet.'));
            }
            document.querySelector('#metric-resolution-time').textContent =
                statistics.averageResolutionDays + (statistics.averageResolutionDays === 1 ? ' day' : ' days');
        }

        function createAdminRow(report) {
            const row = document.createElement('tr');
            const issueCell = document.createElement('td');
            issueCell.append(
                createTextElement('span', 'admin-issue-title', report.title),
                createTextElement('span', 'admin-category', categoryLabels[report.category] || 'Community issue'),
                createTextElement('span', 'admin-category', report.id)
            );
            if (report.overdueDays >= 14 && report.status !== 'solved') {
                report.overdueLabel = createTextElement(
                    'span',
                    'admin-overdue-label',
                    'Overdue — ' + report.overdueDays + ' days unresolved'
                );
                issueCell.append(report.overdueLabel);
            }
            const locationCell = document.createElement('td');
            locationCell.append(
                createTextElement(
                    'span',
                    'admin-issue-title',
                    report.locationPath.map(function (level) { return level.name; }).join(' › ')
                ),
                createTextElement('span', 'admin-category', report.location)
            );
            const dateCell = createTextElement('td', '', formatDate(report.createdAt));
            row.dataset.createdAt = report.createdAt;
            row.dataset.category = report.category;
            row.dataset.priority = report.priority || 'medium';
            const statusCell = document.createElement('td');
            const select = document.createElement('select');
            select.className = 'admin-status';
            select.setAttribute('aria-label', 'Update status for ' + report.title);
            Object.keys(reportStatuses).forEach(function (statusKey) {
                const option = document.createElement('option');
                option.value = statusKey;
                option.textContent = reportStatuses[statusKey].label;
                select.append(option);
            });
            select.value = reportStatuses[report.status] ? report.status : 'reported';
            select.addEventListener('change', async function () {
                const previousStatus = report.status;
                select.disabled = true;
                try {
                    await apiRequest('/api/admin/reports/' + encodeURIComponent(report.id) + '/status', {
                        method: 'PATCH',
                        body: {
                            status: select.value,
                            note: actionNote.value.trim()
                        }
                    });
                    report.status = select.value;
                    actionNote.value = '';
                    row.dataset.status = report.status;
                    if (report.status === 'solved' && report.overdueLabel) {
                        report.overdueLabel.remove();
                        report.overdueLabel = null;
                    }
                    feedback.classList.remove('is-error');
                    feedback.textContent = 'Status updated. Neighbours can see the latest update on the community board.';
                    setCountsFromRows();
                } catch (error) {
                    select.value = previousStatus;
                    feedback.classList.add('is-error');
                    feedback.textContent = error.message;
                } finally {
                    select.disabled = false;
                }
            });
            const actionNote = document.createElement('input');
            actionNote.type = 'text';
            actionNote.maxLength = 300;
            actionNote.className = 'admin-action-note';
            actionNote.placeholder = 'Optional action note';
            actionNote.setAttribute('aria-label', 'Optional action note for ' + report.title);
            statusCell.append(select, actionNote);
            row.dataset.status = report.status;
            const priorityCell = document.createElement('td');
            const prioritySelect = document.createElement('select');
            prioritySelect.className = 'admin-status admin-priority';
            prioritySelect.setAttribute('aria-label', 'Update priority for ' + report.title);
            Object.keys(reportPriorities).forEach(function (priorityKey) {
                const option = document.createElement('option');
                option.value = priorityKey;
                option.textContent = reportPriorities[priorityKey];
                prioritySelect.append(option);
            });
            prioritySelect.value = reportPriorities[report.priority] ? report.priority : 'medium';
            prioritySelect.addEventListener('change', async function () {
                const previousPriority = report.priority || 'medium';
                prioritySelect.disabled = true;
                try {
                    await apiRequest('/api/admin/reports/' + encodeURIComponent(report.id) + '/priority', {
                        method: 'PATCH',
                        body: { priority: prioritySelect.value }
                    });
                    report.priority = prioritySelect.value;
                    row.dataset.priority = report.priority;
                    feedback.classList.remove('is-error');
                    feedback.textContent = 'Priority updated for ' + report.id + '.';
                } catch (error) {
                    prioritySelect.value = previousPriority;
                    feedback.classList.add('is-error');
                    feedback.textContent = error.message;
                } finally {
                    prioritySelect.disabled = false;
                }
            });
            priorityCell.append(prioritySelect);
            issueCell.dataset.priority = report.priority || 'medium';
            const detailsCell = document.createElement('td');
            const detailsButton = createTextElement('button', 'report-details-button', 'View');
            detailsButton.type = 'button';
            detailsButton.addEventListener('click', function () { showReportDetails(report.id); });
            detailsCell.append(detailsButton);
            row.append(issueCell, locationCell, dateCell, priorityCell, statusCell, detailsCell);
            return row;
        }

        function setCountsFromRows() {
            const reports = Array.from(reportList.querySelectorAll('tr')).map(function (row) {
                const select = row.querySelector('.admin-status:not(.admin-priority)');
                return select ? select.value : 'reported';
            });
            setCounts({
                total: reports.length,
                reported: reports.filter(function (status) { return status === 'reported'; }).length,
                progress: reports.filter(function (status) { return status === 'progress'; }).length,
                solved: reports.filter(function (status) { return status === 'solved'; }).length,
                residents: Number(document.querySelector('#metric-residents').textContent) || 0,
                overdue: Array.from(reportList.querySelectorAll('tr')).filter(function (row) {
                    const status = row.querySelector('.admin-status:not(.admin-priority)');
                    return status && status.value !== 'solved' &&
                        Date.now() - Date.parse(row.dataset.createdAt) >= 14 * 24 * 60 * 60 * 1000;
                }).length
            });
        }

        function showAdminGate(message, isError) {
            overview.hidden = true;
            panel.hidden = true;
            areaCard.hidden = true;
            announcementsPanel.hidden = true;
            flagsPanel.hidden = true;
            gate.hidden = false;
            gate.querySelector('p').textContent = message;
            gate.classList.toggle('is-error', Boolean(isError));
            if (currentUser) {
                gate.querySelector('a').hidden = true;
                gate.querySelector('.admin-gate-home').hidden = false;
            } else {
                gate.querySelector('a').hidden = false;
                gate.querySelector('.admin-gate-home').hidden = true;
            }
        }

        function renderRows(reports) {
            reportList.replaceChildren.apply(reportList, reports.map(createAdminRow));
            table.hidden = reports.length === 0;
            emptyState.hidden = reports.length !== 0;
            search.disabled = reports.length === 0;
            const rows = Array.from(reportList.querySelectorAll('tr'));
            function filterAdminRows() {
                const query = search.value.trim().toLocaleLowerCase();
                let visibleRows = 0;
                rows.forEach(function (row) {
                    const reportDate = String(row.dataset.createdAt).slice(0, 10);
                    const ageDays = (Date.now() - Date.parse(row.dataset.createdAt)) / (24 * 60 * 60 * 1000);
                    const overdue = row.dataset.status !== 'solved' && ageDays >= 14;
                    const matches = row.textContent.toLocaleLowerCase().includes(query) &&
                        (!statusFilter.value || statusFilter.value === row.dataset.status ||
                            (statusFilter.value === 'overdue' && overdue)) &&
                        (!categoryFilter.value || categoryFilter.value === row.dataset.category) &&
                        (!priorityFilter.value || priorityFilter.value === row.dataset.priority) &&
                        (!dateFrom.value || reportDate >= dateFrom.value) &&
                        (!dateTo.value || reportDate <= dateTo.value);
                    row.hidden = !matches;
                    if (matches) {
                        visibleRows += 1;
                    }
                });
                if (reports.length === 0) {
                    emptyState.hidden = false;
                    return;
                }
                emptyState.hidden = visibleRows !== 0;
                emptyState.querySelector('strong').textContent = 'No reports match that search';
                emptyState.querySelector('p').textContent = 'Try another search, status, or date range.';
                emptyState.querySelector('a').hidden = true;
            }
            [search, categoryFilter, priorityFilter, statusFilter, dateFrom, dateTo].forEach(function (control) {
                control.addEventListener(control === search ? 'input' : 'change', filterAdminRows);
            });
            filterAdminRows();
        }

        if (!currentUser || currentUser.role !== 'admin') {
            showAdminGate(
                currentUser ? 'This area is only available to MtaaFix administrators.' : 'Sign in with an administrator account to review and manage community reports.',
                false
            );
            return;
        }

        gate.hidden = true;
        overview.hidden = false;
        panel.hidden = false;
        announcementsPanel.hidden = false;
        flagsPanel.hidden = false;
        apiRequest('/api/admin/reports')
            .then(function (result) {
                setCounts(result.counts);
                renderRows(result.reports);
                areaCard.hidden = false;
                document.querySelector('#admin-area-path').textContent =
                    result.administrativeArea.path.map(function (level) { return level.name; }).join(' › ');
                document.querySelector('#admin-area-role').textContent = result.administrativeArea.title;
                document.querySelector('#admin-area-approval').textContent =
                    'Approved by ' + result.administrativeArea.approvedBy + ' · ' + formatDate(result.administrativeArea.approvedAt);
            })
            .catch(function (error) {
                if (error.status === 401 || error.status === 403) {
                    showAdminGate(error.message, false);
                    return;
                }
                feedback.classList.add('is-error');
                feedback.textContent = error.message;
            });

        apiRequest('/api/admin/statistics')
            .then(renderStatistics)
            .catch(function (error) {
                if (statisticsPanel) {
                    statisticsPanel.querySelector('.admin-statistics-feedback').textContent = error.message;
                }
            });

        function loadAdminFlags() {
            apiRequest('/api/admin/flags')
                .then(function (result) {
                    const cards = result.flags.map(function (flag) {
                        const card = document.createElement('article');
                        card.className = 'admin-flag-card';
                        card.append(
                            createTextElement('p', 'eyebrow', flag.reason + ' · ' + flag.status),
                            createTextElement('h3', '', flag.reportTitle),
                            createTextElement('p', '', flag.reportId + ' · ' + flag.location + ' · ' +
                                (categoryLabels[flag.category] || flag.category)),
                            createTextElement('p', '', flag.details || 'No additional details provided.'),
                            createTextElement('small', '', formatDate(flag.createdAt))
                        );
                        if (flag.adminNote) {
                            card.append(createTextElement('p', '', 'Admin note: ' + flag.adminNote));
                        }
                        if (flag.status === 'open') {
                            const note = document.createElement('input');
                            note.type = 'text';
                            note.maxLength = 300;
                            note.placeholder = 'Optional moderation note';
                            note.setAttribute('aria-label', 'Optional note for flag ' + flag.id);
                            ['reviewed', 'dismissed'].forEach(function (nextStatus) {
                                const button = createTextElement(
                                    'button',
                                    'button button-small button-secondary',
                                    nextStatus === 'reviewed' ? 'Mark reviewed' : 'Dismiss flag'
                                );
                                button.type = 'button';
                                button.addEventListener('click', async function () {
                                    button.disabled = true;
                                    try {
                                        await apiRequest('/api/admin/flags/' + flag.id, {
                                            method: 'PATCH',
                                            body: { status: nextStatus, note: note.value.trim() }
                                        });
                                        loadAdminFlags();
                                    } catch (error) {
                                        flagFeedback.classList.add('is-error');
                                        flagFeedback.textContent = error.message;
                                        button.disabled = false;
                                    }
                                });
                                card.append(button);
                            });
                            card.append(note);
                        }
                        return card;
                    });
                    flagList.replaceChildren.apply(flagList, cards);
                    flagEmpty.hidden = cards.length !== 0;
                    flagFeedback.textContent = '';
                    flagFeedback.classList.remove('is-error');
                })
                .catch(function (error) {
                    flagFeedback.classList.add('is-error');
                    flagFeedback.textContent = error.message;
                });
        }
        loadAdminFlags();

        function loadAdminAnnouncements() {
            apiRequest('/api/admin/announcements')
                .then(function (result) {
                    announcementList.replaceChildren.apply(
                        announcementList,
                        result.announcements.map(createAnnouncementCard)
                    );
                    announcementEmpty.hidden = result.announcements.length !== 0;
                })
                .catch(function (error) {
                    announcementEmpty.hidden = false;
                    announcementEmpty.textContent = error.message;
                });
        }

        announcementForm.addEventListener('submit', async function (event) {
            event.preventDefault();
            announcementFeedback.classList.remove('is-error');
            announcementFeedback.textContent = '';
            const submitButton = announcementForm.querySelector('[type="submit"]');
            submitButton.disabled = true;
            const formData = new FormData(announcementForm);
            try {
                await apiRequest('/api/admin/announcements', {
                    method: 'POST',
                    body: {
                        title: formData.get('title').trim(),
                        body: formData.get('body').trim()
                    }
                });
                announcementForm.reset();
                announcementFeedback.textContent = 'Your update is now visible to residents in your assigned area.';
                loadAdminAnnouncements();
            } catch (error) {
                announcementFeedback.classList.add('is-error');
                announcementFeedback.textContent = error.message;
            } finally {
                submitButton.disabled = false;
            }
        });
        loadAdminAnnouncements();
    }

    const locationSetup = Promise.all([
        setupLocationFields('#registration-location-fields', '#location-feedback', '#location-unit-id'),
        setupLocationFields('#profile-location-fields', '#profile-location-feedback', '#profile-location-unit-id')
    ]);
    const sessionReady = apiRequest('/api/auth/session')
        .then(function (result) {
            currentUser = result.user;
            registrationEnabled = result.registrationEnabled !== false;
            renderAuthNavigation();
            if (!registrationEnabled) {
                document.querySelectorAll('[data-auth-form="register"] input, [data-auth-form="register"] select, [data-auth-form="register"] button').forEach(function (control) {
                    control.disabled = true;
                });
                document.querySelectorAll('[data-auth-form="register"] .auth-feedback').forEach(function (feedback) {
                    feedback.textContent = 'New account registration is temporarily paused while verified location data is prepared.';
                });
            }
            updateReportFormAccess();
            return result;
        })
        .catch(function (error) {
            document.querySelectorAll('.form-feedback').forEach(function (feedback) {
                feedback.classList.add('is-error');
                feedback.textContent = error.message + ' Start the app with npm start, then reload this page.';
            });
            const gate = document.querySelector('#admin-access-gate');
            if (gate) {
                gate.hidden = false;
                gate.querySelector('p').textContent = error.message + ' Start the app with npm start, then reload this page.';
            }
            throw error;
        });

    setupAuthForms();
    setupProfileLocationForm();
    setupReportForm();
    sessionReady.then(function () {
        setupBoard();
        setupLocalAnnouncements();
        setupAdminDashboard();
        setupProfilePage();
        setupNotificationsPage();
    }).catch(function () {
        const boardFeedback = document.querySelector('#board-feedback');
        if (boardFeedback) {
            boardFeedback.textContent = 'MtaaFix could not connect to its server. Start the app with npm start, then reload this page.';
        }
    });
}());
