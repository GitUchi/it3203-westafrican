/**
 * West African Traditional Foods — IT 3203 Class Project
 * External JavaScript file: js/main.js
 *
 * Responsibilities:
 *  1. Mobile hamburger navigation toggle
 *  2. Close nav when a link is tapped (single-page mobile UX)
 *  3. Quiz logic: submit, grade, display results, reset
 *  4. Responsive table scroll hint (adds wrapper div if missing)
 */

/* ============================================================
   1. HAMBURGER NAVIGATION TOGGLE
   Toggles the .nav-open class on .site-nav when the toggle
   button is clicked. The CSS uses this class to show/hide
   the nav list and animate the hamburger icon.
   ============================================================ */
(function initNav() {
  var nav    = document.querySelector('.site-nav');
  var toggle = document.querySelector('.nav-toggle');

  if (!nav || !toggle) return; // guard: elements must exist

  // Toggle open/close on button click
  toggle.addEventListener('click', function () {
    var isOpen = nav.classList.toggle('nav-open');
    // Update aria-expanded for screen readers
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  // Close the mobile nav when any nav link is clicked
  // (important on mobile so the menu collapses after navigation)
  var navLinks = nav.querySelectorAll('a');
  navLinks.forEach(function (link) {
    link.addEventListener('click', function () {
      nav.classList.remove('nav-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });

  // Close nav when user taps outside the nav area
  document.addEventListener('click', function (e) {
    if (!nav.contains(e.target)) {
      nav.classList.remove('nav-open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
})();


/* ============================================================
   2. RESPONSIVE TABLE HELPER
   Wraps any <table> that doesn't already have a
   .table-responsive parent in a scroll-enabled div.
   This ensures tables added without the wrapper still
   scroll correctly on small screens.
   ============================================================ */
(function wrapTables() {
  var tables = document.querySelectorAll('table');
  tables.forEach(function (table) {
    // Only wrap if parent isn't already .table-responsive
    if (!table.parentElement.classList.contains('table-responsive')) {
      var wrapper = document.createElement('div');
      wrapper.className = 'table-responsive';
      table.parentNode.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    }
  });
})();


/* ============================================================
   3. QUIZ LOGIC
   Only runs on the quiz page (checks for #quiz-form element).

   Answer key:
     Q1 (fill-blank)  : "palm oil"  (case-insensitive)
     Q2 (radio)       : "A"  — Senegal / Thiéboudienne
     Q3 (radio)       : "C"  — Pounded yam or cassava
     Q4 (radio)       : "B"  — Ground melon seeds
     Q5 (checkboxes)  : A, B, D, E — Cassava, Plantain, Yam, Millet
   ============================================================ */

// Only initialize quiz logic if the quiz form exists on this page
if (document.getElementById('quiz-form')) {

  /* -- Answer Key -- */
  var ANSWERS = {
    q1: 'palm oil',
    q2: 'A',
    q3: 'C',
    q4: 'B',
    q5: ['A', 'B', 'D', 'E']
  };

  /* -- Friendly question text for result cards -- */
  var QUESTION_TEXTS = {
    q1: 'Fill in the blank: the red oil pressed from the oil palm fruit used across West African cuisines.',
    q2: 'Which West African country claims the most internationally recognized version of Jollof Rice?',
    q3: 'What is Fufu primarily made from?',
    q4: 'Egusi soup is named after its key ingredient. What is Egusi?',
    q5: 'Which of the following are staple foods commonly eaten across West Africa? (Select all that apply)'
  };

  /* -- Correct answer descriptions shown in result cards -- */
  var CORRECT_DESCRIPTIONS = {
    q1: 'Palm Oil',
    q2: 'Senegal (Thiéboudienne)',
    q3: 'Pounded yam or cassava (or a blend of both)',
    q4: 'Ground melon seeds',
    q5: 'Cassava, Plantain, Yam, and Millet'
  };

  /**
   * submitQuiz()
   * Reads form values, grades answers, renders results, scrolls to panel.
   * Called by the Submit button's onclick attribute.
   */
  window.submitQuiz = function () {
    var userAnswers = getUserAnswers();
    var results     = gradeQuiz(userAnswers);

    var totalCorrect   = results.filter(function (r) { return r.correct; }).length;
    var totalQuestions = results.length;
    var percentage     = Math.round((totalCorrect / totalQuestions) * 100);
    var passed         = percentage >= 60; // passing threshold: 60%

    renderScoreBanner(totalCorrect, totalQuestions, percentage, passed);
    renderResultCards(results, userAnswers);

    var panel = document.getElementById('results-panel');
    panel.style.display = 'block';
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  /**
   * resetQuiz()
   * Clears all form inputs and hides the results panel.
   * Called by the Reset button's onclick attribute.
   */
  window.resetQuiz = function () {
    // Clear text input
    var q1 = document.getElementById('q1-input');
    if (q1) q1.value = '';

    // Uncheck all radio buttons
    document.querySelectorAll('input[type="radio"]').forEach(function (r) {
      r.checked = false;
    });

    // Uncheck all checkboxes
    document.querySelectorAll('input[type="checkbox"]').forEach(function (cb) {
      cb.checked = false;
    });

    // Hide results panel and clear injected HTML
    var panel = document.getElementById('results-panel');
    if (panel) panel.style.display = 'none';

    var scoreBanner = document.getElementById('score-banner-container');
    if (scoreBanner) scoreBanner.innerHTML = '';

    var resultCards = document.getElementById('result-cards-container');
    if (resultCards) resultCards.innerHTML = '';

    // Scroll back to top of quiz form
    var form = document.getElementById('quiz-form');
    if (form) form.scrollIntoView({ behavior: 'smooth' });
  };

  /**
   * getUserAnswers()
   * Reads and returns all form values as a plain object.
   */
  function getUserAnswers() {
    var q1Input = document.getElementById('q1-input');
    var q2Sel   = document.querySelector('input[name="q2"]:checked');
    var q3Sel   = document.querySelector('input[name="q3"]:checked');
    var q4Sel   = document.querySelector('input[name="q4"]:checked');
    var q5Checked = Array.from(
      document.querySelectorAll('input[name="q5"]:checked')
    ).map(function (cb) { return cb.value; });

    return {
      q1: q1Input ? q1Input.value.trim().toLowerCase() : '',
      q2: q2Sel ? q2Sel.value : null,
      q3: q3Sel ? q3Sel.value : null,
      q4: q4Sel ? q4Sel.value : null,
      q5: q5Checked
    };
  }

  /**
   * gradeQuiz(userAnswers)
   * Compares userAnswers to the ANSWERS key.
   * Returns an array of { qKey, correct } objects.
   */
  function gradeQuiz(userAnswers) {
    var results = [];

    // Q1: case-insensitive string match
    results.push({ qKey: 'q1', correct: userAnswers.q1 === ANSWERS.q1 });

    // Q2–Q4: exact string match
    ['q2', 'q3', 'q4'].forEach(function (qKey) {
      results.push({ qKey: qKey, correct: userAnswers[qKey] === ANSWERS[qKey] });
    });

    // Q5: multi-select — sort both arrays and compare as comma string
    var userQ5  = userAnswers.q5.slice().sort().join(',');
    var correctQ5 = ANSWERS.q5.slice().sort().join(',');
    results.push({ qKey: 'q5', correct: userQ5 === correctQ5 });

    return results;
  }

  /**
   * renderScoreBanner(totalCorrect, totalQuestions, percentage, passed)
   * Injects the pass/fail score banner into #score-banner-container.
   */
  function renderScoreBanner(totalCorrect, totalQuestions, percentage, passed) {
    var container = document.getElementById('score-banner-container');
    if (!container) return;
    var verdict  = passed ? '✓ PASSED' : '✗ FAILED';
    var cssClass = passed ? 'pass' : 'fail';
    container.innerHTML =
      '<div class="score-banner ' + cssClass + '" role="status">' +
        '<div class="result-verdict">' + verdict + '</div>' +
        '<div class="result-score">You answered <strong>' + totalCorrect +
        '</strong> of <strong>' + totalQuestions +
        '</strong> correctly — <strong>' + percentage + '%</strong></div>' +
      '</div>';
  }

  /**
   * renderResultCards(results, userAnswers)
   * Injects one result card per question into #result-cards-container.
   */
  function renderResultCards(results, userAnswers) {
    var container = document.getElementById('result-cards-container');
    if (!container) return;
    container.innerHTML = '';  // clear previous results

    results.forEach(function (result, index) {
      var qNum    = index + 1;
      var badge   = result.correct
        ? '<span class="badge-correct">✓ Correct</span>'
        : '<span class="badge-incorrect">✗ Incorrect</span>';

      // Format the user's answer for display
      var userDisplay = '';
      if (result.qKey === 'q5') {
        userDisplay = userAnswers.q5.length > 0
          ? getCheckboxLabels(userAnswers.q5)
          : '(none selected)';
      } else if (result.qKey === 'q1') {
        userDisplay = userAnswers.q1 !== '' ? userAnswers.q1 : '(blank)';
      } else {
        userDisplay = userAnswers[result.qKey]
          ? getRadioLabel(result.qKey, userAnswers[result.qKey])
          : '(not answered)';
      }

      // Build answer row HTML
      var answerRow = result.correct
        ? '<p class="result-detail"><strong>Answer:</strong> ' +
          '<span class="answer-correct-text">' + CORRECT_DESCRIPTIONS[result.qKey] + '</span></p>'
        : '<p class="result-detail"><strong>Your answer:</strong> ' +
          '<span class="answer-incorrect-text">' + escapeHtml(userDisplay) + '</span></p>' +
          '<p class="result-detail"><strong>Correct answer:</strong> ' +
          '<span class="answer-correct-text">' + CORRECT_DESCRIPTIONS[result.qKey] + '</span></p>';

      var card = document.createElement('div');
      card.className = 'result-card';
      card.innerHTML =
        '<div class="result-question-head">' +
          '<span style="font-family:var(--font-heading);color:var(--text-mid);font-size:0.88rem;">Q' + qNum + '</span>' +
          badge +
          '<span class="rq-text">' + QUESTION_TEXTS[result.qKey] + '</span>' +
        '</div>' +
        answerRow;
      container.appendChild(card);
    });
  }

  /** Returns the visible label text for a selected radio option. */
  function getRadioLabel(qName, value) {
    var input = document.querySelector('input[name="' + qName + '"][value="' + value + '"]');
    if (!input) return value;
    var label = document.querySelector('label[for="' + input.id + '"]');
    return label ? label.textContent.trim() : value;
  }

  /** Returns comma-joined label texts for checked checkboxes. */
  function getCheckboxLabels(values) {
    return values.map(function (val) {
      var input = document.querySelector('input[name="q5"][value="' + val + '"]');
      if (!input) return val;
      var label = document.querySelector('label[for="' + input.id + '"]');
      return label ? label.textContent.trim() : val;
    }).join(', ');
  }

  /** Escapes HTML entities to prevent XSS when inserting user input into innerHTML. */
  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

} // end quiz logic block
