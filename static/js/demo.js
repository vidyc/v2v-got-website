(function () {
  "use strict";

  var DATA_URL = "./static/demo/demo_data.json";

  var scenarioSel = document.getElementById("demo-scenario");
  var frameSel    = document.getElementById("demo-frame");
  var runBtn      = document.getElementById("demo-run");
  var satImg      = document.getElementById("demo-sat");
  var bevImg      = document.getElementById("demo-bev");
  var gotDiv      = document.getElementById("demo-got");
  var infoDiv     = document.getElementById("demo-info");

  if (!scenarioSel) { return; }

  var data = null;

  function escapeHtml(s) {
    if (s === null || s === undefined) { return ""; }
    return String(s)
      .replace(/&/g,  "&amp;")
      .replace(/</g,  "&lt;")
      .replace(/>/g,  "&gt;")
      .replace(/"/g,  "&quot;")
      .replace(/'/g,  "&#39;");
  }

  function fail(msg) {
    infoDiv.textContent = msg;
    gotDiv.innerHTML = "";
    satImg.removeAttribute("src");
    bevImg.removeAttribute("src");
    runBtn.disabled = true;
  }

  function populateScenarios() {
    scenarioSel.innerHTML = "";
    data.scenarios.forEach(function (sc, i) {
      var opt = document.createElement("option");
      opt.value = String(i);
      var idx = String(i).padStart(2, "0");
      opt.textContent = "[" + idx + "] " + sc.name;
      scenarioSel.appendChild(opt);
    });
  }

  function populateFrames(si) {
    frameSel.innerHTML = "";
    var sc = data.scenarios[si];
    if (!sc) { return; }
    sc.frames.forEach(function (fr) {
      var opt = document.createElement("option");
      opt.value = String(fr.ti);
      opt.textContent = "t=" + fr.ti + "   (frame " + fr.frame + ")";
      frameSel.appendChild(opt);
    });
  }

  function findFrame(sc, ti) {
    for (var i = 0; i < sc.frames.length; i++) {
      if (sc.frames[i].ti === ti) { return sc.frames[i]; }
    }
    return null;
  }

  function findStageOutput(frame, q) {
    for (var i = 0; i < frame.stages.length; i++) {
      if (frame.stages[i].q === q) { return frame.stages[i]; }
    }
    return null;
  }

  function renderGoT(frame) {
    var parts = [];
    data.stages.forEach(function (stage) {
      var out  = findStageOutput(frame, stage.q);
      var osm  = stage.osm ? '<span class="got-stage-osm">OSM</span>' : "";
      var body;
      if (!out || (!out.question && !out.answer)) {
        body = '<div class="got-empty">Inference pending or no sample for this frame.</div>';
      } else {
        body =
          '<div class="got-block got-q">' + escapeHtml(out.question) + '</div>' +
          '<div class="got-block got-a">' + escapeHtml(out.answer)   + '</div>';
      }
      parts.push(
        '<div class="got-stage" style="--stage-color:' + stage.color + '">' +
          '<div class="got-stage-head">' +
            '<span class="got-stage-name">' + escapeHtml(stage.q) + '</span>' +
            osm +
            '<span class="got-stage-desc">' + escapeHtml(stage.desc) + '</span>' +
          '</div>' +
          body +
        '</div>'
      );
    });
    gotDiv.innerHTML = parts.join("");
  }

  function visualise() {
    var si = parseInt(scenarioSel.value, 10);
    var ti = parseInt(frameSel.value, 10);
    var sc = data.scenarios[si];
    if (!sc) { return; }
    var fr = findFrame(sc, ti);
    if (!fr) {
      infoDiv.textContent = "No data for scenario " + si + ", frame " + ti + ".";
      return;
    }
    satImg.src = fr.sat;
    bevImg.src = fr.bev;
    renderGoT(fr);
    var ready = fr.stages.filter(function (s) { return s.answer && s.answer.length; }).length;
    infoDiv.innerHTML =
      "<strong>" + escapeHtml(sc.name) + "</strong>" +
      "  &middot;  split <code>" + escapeHtml(sc.split) + "</code>" +
      "  &middot;  frame <code>" + escapeHtml(fr.frame) + "</code>" +
      "  &middot;  <strong>" + ready + " / " + data.stages.length + " stages ready</strong>";
  }

  scenarioSel.addEventListener("change", function () {
    populateFrames(parseInt(scenarioSel.value, 10));
  });
  runBtn.addEventListener("click", visualise);

  fetch(DATA_URL, { cache: "no-cache" })
    .then(function (r) {
      if (!r.ok) { throw new Error("HTTP " + r.status); }
      return r.json();
    })
    .then(function (d) {
      data = d;
      if (!data || !Array.isArray(data.scenarios) || data.scenarios.length === 0) {
        fail("Demo data file is empty. Generate it with: python tools/build_demo.py");
        return;
      }
      populateScenarios();
      populateFrames(0);
      runBtn.disabled = false;
      visualise();
    })
    .catch(function (err) {
      fail("Demo data not available (" + err.message + "). " +
           "Run python tools/build_demo.py on the inference host to populate static/demo/.");
    });
})();
