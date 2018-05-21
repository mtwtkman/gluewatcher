const mainRegion = document.getElementById('main');

const Filtering = {
    state: 'all',
};

const FilterState = {
    view() {
        return m('div', [
            m(
                'select',
                { oninput: m.withAttr('value', v => Filtering.state = v) },
                ['all', 'RUNNING', 'FAILED', 'STOPPED', 'SUCCEEDED'].map(x => m('option', { value: x }, x))
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
    data: [],
    conn: new WebSocket('ws://localhost:55301/ws'),
    oninit(vnode) {
        vnode.state.conn.onmessage = ev => {
            console.log(JSON.parse(ev.data));
            vnode.state.data = JSON.parse(ev.data);
            setTimeout(() => vnode.state.conn.send('hi!'), 1000);
            m.redraw();
        };
        vnode.state.conn.onopen = ev => vnode.state.conn.send('hi!');
    },
    view(vnode) {
        return m('ul', vnode.state.data.map(x => {
            const runs = x.runs.filter(y => {
                if (Filtering.state === 'all') return y
                if (y.state === Filtering.state) return y
            });
            if (runs.length === 0) return;
            return m('li', [
                m('div', x.job),
                m(
                    'div',
                    {style: {'margin-left': '1em'}},
                    runs.map(y => m('div', m(StateMap[y.state], { msg: `${y.started_at}: ${y.state}` })))
                ),
            ])
        }))
    },
};

const Component = {
    view() {
        return m(
            'div', [
                m(FilterState),
                m(List)
            ]
        );
    },
};

m.mount(mainRegion, Component);
