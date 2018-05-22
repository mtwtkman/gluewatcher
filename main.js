const mainRegion = document.getElementById('main');

const Time = {
    view(vnode) {
        return m('div', `${vnode.attrs.fetchedTime} 取得`);
    },
};

const Filtering = {
    state: 'all',
    job: 'all',
};

const FilterState = {
    view() {
        return m('div', [
            m('label', 'State: '),
            m(
                'select',
                { oninput: m.withAttr('value', v => Filtering.state = v) },
                ['all', 'RUNNING', 'FAILED', 'STOPPED', 'SUCCEEDED'].map(x => m('option', { value: x }, x))
            ),
        ]);
    },
};

const FilterJobs = {
    view(vnode) {
        return m('div', [
            m('label', 'Jobs: '),
            m(
                'select',
                { oninput: m.withAttr('value', v => Filtering.job = v) },
                ['all', ...vnode.attrs.jobs].map(x => m('option', { value: x }, x)),
            ),
        ]);
    },
};

const Running = {
    view(vnode) {
        return m('span', { style: { color: 'blue' }}, vnode.attrs.msg);
    },
};

const Failed = {
    view(vnode) {
        return m('span', { style: { color: 'red' }}, vnode.attrs.msg);
    },
};

const Stopped = {
    view(vnode) {
        return m('span', { style: { color: 'purple' }}, vnode.attrs.msg);
    },
};

const Succeeded = {
    view(vnode) {
        return m('span', { style: { color: 'green' }}, vnode.attrs.msg);
    },
};

const StateMap = {
    RUNNING: Running,
    FAILED: Failed,
    STOPPED: Stopped,
    SUCCEEDED: Succeeded,
};

const List = {
    view(vnode) {
        return m('ul', vnode.attrs.runs.filter(x => {
            if (Filtering.job === 'all') return x;
            if (x.job === Filtering.job) return x;
        }).map(x => {
            const runs = x.runs.filter(y => {
                if (Filtering.state === 'all') return y;
                if (y.state === Filtering.state) return y;
            });
            if (runs.length === 0) return;
            return m('li', [
                m('div', x.job),
                m(
                    'div',
                    {style: {'margin-left': '1em'}},
                    runs.map(y => m(
                        'div',
                        m(StateMap[y.state], { msg: `${y.started_at}: ${y.state}` })
                    ))
                ),
            ])
        }))
    },
};

const Component = {
    runs: [],
    jobs: [],
    runnings: null,
    fetchedTime: '',
    conn: new WebSocket('ws://localhost:55301/ws'),
    oninit(vnode) {
        vnode.state.conn.onmessage = ev => {
            const data = JSON.parse(ev.data);
            vnode.state.runs = data.runs;
            const runnings = new Set(data.runs
                .filter(x => x.runs.filter(y => y.state === 'RUNNING').length !== 0)
                .map(x => x.job));
            if (vnode.state.runnings !== null) {
                const done = new Set([...vnode.state.runnings].filter(x => !runnings.has(x)));
                if (done.size > 0) {
                    new Notification(`FINISHED: ${[...done].join(',')}`);
                }
                const started = new Set([...runnings].filter(x => !vnode.state.runnings.has(x)));
                if (started.size > 0) {
                    new Notification(`STARTED: ${[...started].join(',')}`);
                }
            }
            vnode.state.runnings = runnings;
            vnode.state.jobs = data.jobs;
            vnode.state.fetchedTime = new Date();
            setTimeout(() => vnode.state.conn.send('hi!'), 5000);
            m.redraw();
        };
        vnode.state.conn.onopen = ev => vnode.state.conn.send('hi!');
    },
    view(vnode) {
        return m(
            'div', [
                m(Time, {fetchedTime: vnode.state.fetchedTime}),
                m(FilterState),
                m(FilterJobs, { jobs: vnode.state.jobs }),
                m(List, { runs: vnode.state.runs }),
            ]
        );
    },
};

m.mount(mainRegion, Component);
