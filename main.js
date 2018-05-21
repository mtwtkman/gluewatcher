const mainRegion = document.getElementById('main');

let Filtering = 'all';

const Filter = {
    view() {
        return m('div', [
            m(
                'select',
                { oninput: m.withAttr('value', v => Filtering = v) },
                ['all', 'RUNNING', 'FAILED', 'STOPPED', 'SUCCEEDED'].map(x => m('option', { value: x }, x))
            ),
        ]);
    },
};

const List = {
    data: [],
    conn: new WebSocket('ws://localhost:55301/ws'),
    oninit(vnode) {
        vnode.state.conn.onmessage = ev => {
            console.log(JSON.parse(ev.data));
            vnode.state.data = JSON.parse(ev.data);
            m.redraw();
        };
        vnode.state.conn.onopen = ev => vnode.state.conn.send('hi!');
    },
    onupdate(vnode) {
        // vnode.state.conn.send('hi!')
    },
    view(vnode) {
        return m('ul', vnode.state.data.map(x => {
            return m('li', [
                m('div', x.job),
                m(
                    'div',
                    {style: {'margin-left': '1em'}},
                    x.runs.filter(y => {
                        if (Filtering === 'all') return y
                        if (y.state === Filtering) return y
                    }).map(y => m('div', `${y.started_at}: ${y.state}`))
                ),
            ])
        }))
    },
};

const Component = {
    view() {
        return m(
            'div', [
                m(Filter),
                m(List)
            ]
        );
    },
};

m.mount(mainRegion, Component);
