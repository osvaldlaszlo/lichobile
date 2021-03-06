import * as m from 'mithril';
import * as helper from '../../helper';
import router from '../../../router';
import settings, { SettingsProp } from '../../../settings';
import * as stream from 'mithril/stream';

interface Data {
  db: {
    available: string[]
    selected: SettingsProp<string>
  },
  rating: {
    available: number[]
    selected: SettingsProp<number[]>
  },
  speed: {
    available: string[]
    selected: SettingsProp<string[]>
  }
}

interface Controller {
  open: Mithril.Stream<boolean>
  data: Data
  toggleOpen(): void
  toggleDb(db: string): void
  toggleRating(v: number): void
  toggleSpeed(v: string): void
  fullHouse(): boolean
  serialize(): string
}

export default {

  controller(variant: Variant, onClose: (changed: boolean) => void) {
    const available = ['lichess'];
    if (variant.key === 'standard' || variant.key === 'fromPosition') {
      available.push('masters');
    }

    const open = stream(false);

    const data = {
      db: {
        available: available,
        selected: available.length > 1 ? settings.analyse.explorer.db : function() {
          return available[0];
        }
      },
      rating: {
        available: settings.analyse.explorer.availableRatings,
        selected: settings.analyse.explorer.rating
      },
      speed: {
        available: settings.analyse.explorer.availableSpeeds,
        selected: settings.analyse.explorer.speed
      }
    };

    let openedWith: string;

    function serialize() {
      return JSON.stringify(['db', 'rating', 'speed'].map(k =>
        data[k].selected()
      ));
    }

    function doOpen() {
      router.backbutton.stack.push(doClose);
      openedWith = serialize();
      open(true);
    }

    function doClose(fromBB?: string) {
      if (fromBB !== 'backbutton' && open()) router.backbutton.stack.pop();
      open(false);
      onClose(openedWith !== serialize());
    }

    function toggleMany(c: SettingsProp<any>, value: any) {
      if (c().indexOf(value) === -1) c(c().concat([value]));
      else if (c().length > 1) c(c().filter((v: any) => {
        return v !== value;
      }));
    }

    return {
      open,
      data,
      toggleOpen() {
        if (open()) doClose();
        else doOpen();
      },
      toggleDb(db: string) {
        data.db.selected(db);
      },
      toggleRating: (v: number) => toggleMany(data.rating.selected, v),
      toggleSpeed: (v: string) => toggleMany(data.speed.selected, v),
      fullHouse() {
        return data.db.selected() === 'masters' || (
          data.rating.selected().length === data.rating.available.length &&
          data.speed.selected().length === data.speed.available.length
        );
      },
      serialize
    };
  },

  view(ctrl: Controller) {
    const d = ctrl.data;
    return [
      m('section.db', [
        m('label', 'Database'),
        m('div.form-multipleChoice', d.db.available.map(s => {
          return m('span', {
            className: d.db.selected() === s ? 'selected' : '',
            oncreate: helper.ontapY(() => ctrl.toggleDb(s))
          }, s);
        }))
      ]),
      d.db.selected() === 'masters' ? m('div.masters.message', [
        m('i[data-icon=C]'),
        m('p', 'Two million OTB games'),
        m('p', 'of 2200+ FIDE rated players'),
        m('p', 'from 1952 to 2016')
      ]) : m('div', [
        m('section.rating', [
          m('label', 'Players Average rating'),
          m('div.form-multipleChoice',
            d.rating.available.map(r => {
              return m('span', {
                className: d.rating.selected().indexOf(r) > -1 ? 'selected' : '',
                oncreate: helper.ontapY(() => ctrl.toggleRating(r))
              }, r);
            })
          )
        ]),
        m('section.speed', [
          m('label', 'Game speed'),
          m('div.form-multipleChoice',
            d.speed.available.map(s => {
              return m('span', {
                className: d.speed.selected().indexOf(s) > -1 ? 'selected' : '',
                oncreate: helper.ontapY(() => ctrl.toggleSpeed(s))
              }, s);
            })
          )
        ])
      ]),
      m('section.save',
        m('button.button.text[data-icon=E]', {
          oncreate: helper.ontapY(ctrl.toggleOpen)
        }, 'All set!')
      )
    ];
  }
};
