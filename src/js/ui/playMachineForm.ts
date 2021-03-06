import * as utils from '../utils';
import router from '../router';
import * as xhr from '../xhr';
import settings, { GameSettings } from '../settings';
import formWidgets from './shared/form';
import popupWidget from './shared/popup';
import i18n from '../i18n';
import ViewOnlyBoard from './shared/ViewOnlyBoard';
import * as helper from './helper';
import * as m from 'mithril';

let isOpen = false;
let fromPositionFen: string;

export default {
  open,

  close,

  openAIFromPosition(fen: string) {
    settings.gameSetup.ai.variant('3');
    open();
    fromPositionFen = fen;
  },

  view() {
    function form() {
      return renderForm(
        'ai',
        settings.gameSetup.ai,
        settings.gameSetup.ai.availableVariants,
        settings.gameSetup.ai.availableTimeModes
      );
    }

    return popupWidget(
      'game_form_popup',
      null,
      form,
      isOpen,
      close
    );
  }

};

function open() {
  router.backbutton.stack.push(close);
  fromPositionFen = null;
  isOpen = true;
}

function close(fromBB?: string) {
  if (fromBB !== 'backbutton' && isOpen) router.backbutton.stack.pop();
  isOpen = false;
}

function startAIGame() {
  return xhr.newAiGame(fromPositionFen)
  .then(function(data) {
    helper.analyticsTrackEvent('Online AI', `New game ${data.game.variant.key}`);
    router.set('/game' + data.url.round);
  })
  .catch(utils.handleXhrError);
}

function renderForm(formName: string, settingsObj: GameSettings, variants: string[][], timeModes: string[][]) {
  const timeMode = settingsObj.timeMode();
  const hasClock = timeMode === '1';

  const generalFieldset = [
    m('div.select_input', {
      key: formName + 'variant'
    }, [
      formWidgets.renderSelect('variant', formName + 'variant', variants, settingsObj.variant)
    ])
  ];

    const colors = [
      ['randomColor', 'random'],
      ['white', 'white'],
      ['black', 'black']
    ];
    generalFieldset.unshift(
      m('div.select_input', {
        key: formName + 'color'
      }, [
        formWidgets.renderSelect('side', formName + 'color', colors, settingsObj.color)
      ])
    );

  if (settingsObj.variant() === '3') {
    generalFieldset.push(m('div.setupPosition', {
      key: 'position'
    }, fromPositionFen ? [
        m('div.setupMiniBoardWrapper', {
          oncreate: helper.ontap(() => {
            close();
            router.set(`/editor/${encodeURIComponent(fromPositionFen)}`);
          })
        }, [
          m(ViewOnlyBoard, { fen: fromPositionFen })
        ])
      ] : m('div', m('button.withIcon.fa.fa-pencil', {
        oncreate: helper.ontap(() => {
          close();
          router.set('/editor');
        })
      }, i18n('boardEditor')))
    ));
  }

  generalFieldset.push(m('div.select_input', {
    key: 'ailevel'
  }, [
    formWidgets.renderSelect('level', 'ailevel', [
      '1', '2', '3', '4', '5', '6', '7', '8'
    ].map(utils.tupleOf), settingsObj.level)
  ]));

  const timeFieldset = [
    m('div.select_input', {
      key: formName + 'timeMode'
    }, [
      formWidgets.renderSelect('clock', formName + 'timeMode', timeModes, settingsObj.timeMode)
    ])
  ];

  if (hasClock) {
    timeFieldset.push(
      m('div.select_input.inline', {
        key: formName + 'time'
      }, [
        formWidgets.renderSelect('time', formName + 'time',
          settings.gameSetup.availableTimes, settingsObj.time, false)
      ]),
      m('div.select_input.inline', {
        key: formName + 'increment'
      }, [
        formWidgets.renderSelect('increment', formName + 'increment',
          settings.gameSetup.availableIncrements.map(utils.tupleOf), settingsObj.increment, false)
      ])
    );
  }

  return m('form.game_form', {
    onsubmit: function(e: Event) {
      e.preventDefault();
      if (!settings.gameSetup.isTimeValid(settingsObj)) return;
      close();
      startAIGame();
    }
  }, [
    m('fieldset', generalFieldset),
    m('fieldset', timeFieldset),
    m('button[data-icon=E][type=submit].newGameButton', i18n('playWithTheMachine'))
  ]);
}
