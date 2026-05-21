(function () {
  'use strict';
  console.log('hey');

  var STORAGE_KEY = 'keybindings.config';

  // Default bindings — match the user's original manual setup.
  // Values are e.key strings. Use 'Unset' to disable an action.
  var DEFAULTS = {
    seekBack:       '1',
    togglePlay:     '2',
    seekForward:    '3',
    setLoopStart:   '4',
    clearLoop:      '5',
    setLoopEnd:     '6',
    arrSelect:      '7',
    vizPicker:      '8',
    qualitySelect:  '9',
  };

  var ACTIONS = {
    seekBack:      { label: 'Seek back 5 s' },
    togglePlay:    { label: 'Play / Pause' },
    seekForward:   { label: 'Seek forward 5 s' },
    setLoopStart:  { label: 'Set loop start (A)' },
    clearLoop:     { label: 'Clear loop' },
    setLoopEnd:    { label: 'Set loop end (B)' },
    arrSelect:     { label: 'Toggle arrangement selector' },
    vizPicker:     { label: 'Toggle viz picker' },
    qualitySelect: { label: 'Toggle quality selector' },
  };

  // ── helpers ────────────────────────────────────────────────────

  function loadBindings() {
    try {
      var saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved && typeof saved === 'object') {
        // Fill in any actions that weren't in the saved config yet
        var merged = {};
        Object.keys(DEFAULTS).forEach(function (action) {
          merged[action] = (saved[action] !== undefined) ? saved[action] : DEFAULTS[action];
        });
        return merged;
      }
    } catch (e) { /* ignore */ }
    return Object.assign({}, DEFAULTS);
  }

  function getAudio() {
    // The global `audio` element is the shared player <audio> tag.
    // Fall back to highway.getAudioElement() if the global isn't set yet.
    if (typeof audio !== 'undefined' && audio instanceof HTMLAudioElement) return audio;
    if (window.highway && typeof window.highway.getAudioElement === 'function') {
      return window.highway.getAudioElement();
    }
    return null;
  }

  function doSeekBy(seconds) {
    var el = getAudio();
    if (!el) return;
    el.currentTime = Math.max(0, el.currentTime + seconds);
  }

  function doTogglePlay() {
    var el = getAudio();
    if (!el) return;
    if (el.paused) { el.play(); } else { el.pause(); }
  }

  function doSetLoopStart() {
    var el = getAudio();
    if (!el) return;
    setLoopStart();
  }

  function doSetLoopEnd() {
    var el = getAudio();
    if (!el) return;
    setLoopEnd();
  }

  function doClearLoop() {
    var el = getAudio();
    if (!el) return;
    clearLoop();
  }

  function doToggleSelect(id){
      const sel = document.getElementById(id);
      // Get the number of options
      const numOptions = sel.options.length;

      // Figure out which one is selected
      let index = sel.selectedIndex;

      // Move to the next option
      index++;

      // Loop back to the start if needed
      if (index >= numOptions) {
        index = 0;
      }
      console.log(index);

      // Update the select menu to the new index
      sel.selectedIndex = index;

      // Optional: trigger change event
      sel.dispatchEvent(new Event("change"));
  }

  // Map action names → handler functions
  var HANDLERS = {
    seekBack:      function () { doSeekBy(-5); },
    togglePlay:    function () { doTogglePlay(); },
    seekForward:   function () { doSeekBy(5); },
    setLoopStart:  function () { doSetLoopStart(); },
    clearLoop:     function () { doClearLoop(); },
    setLoopEnd:    function () { doSetLoopEnd(); },
    arrSelect:     function () { doToggleSelect('arr-select'); },
    vizPicker:     function () { doToggleSelect('viz-picker'); },
    qualitySelect: function () { doToggleSelect('quality-select'); },
  };

  // ── shortcut registration ──────────────────────────────────────

  // Track which keys we have registered so we can unregister them cleanly
  // before re-registering with new bindings.
  var _registered = []; // array of { key, scope }

  function unregisterAll() {
    if (typeof window.unregisterShortcut !== 'function') return;
    _registered.forEach(function (entry) {
      window.unregisterShortcut(entry.key, entry.scope);
    });
    _registered = [];
  }

  function registerAll() {
    if (typeof window.registerShortcut !== 'function') return;

    unregisterAll();

    var bindings = loadBindings();

    Object.keys(ACTIONS).forEach(function (action) {
      var key = bindings[action];
      if (!key || key === 'Unset') return;

      var scope = 'player';
      window.registerShortcut({
        key: key,
        description: ACTIONS[action].label + ' (Keybindings plugin)',
        scope: scope,
        handler: HANDLERS[action],
      });
      _registered.push({ key: key, scope: scope });
    });
  }

  // Initial registration
  registerAll();

  // Re-register whenever the settings panel saves new bindings
  if (window.slopsmith && typeof window.slopsmith.on === 'function') {
    window.slopsmith.on('keybindings:updated', function () {
      registerAll();
    });
  }

})();
