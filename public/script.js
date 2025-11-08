(async function () {
  async function loadTest() {
    try {
      console.log('Fetching test /api/test ...');
      const res = await fetch('/api/test');
      if (!res.ok) throw new Error(`Failed to load test: ${res.status} ${res.statusText}`);
      const data = await res.json();
      console.log('Test loaded:', data);
      document.getElementById('title').innerText = data.title || 'Science Test';
      const qDiv = document.getElementById('questions');
      qDiv.innerHTML = '';
      data.questions.forEach(q => {
        const div = document.createElement('div');
        div.className = 'question';
        const qh = document.createElement('h3');
        qh.innerText = q.question;
        div.appendChild(qh);
        const choices = document.createElement('div');
        choices.className = 'choices';
        q.choices.forEach((c, idx) => {
          const id = `q_${q.id}_${idx}`;
          const l = document.createElement('label');
          l.htmlFor = id;
          const r = document.createElement('input');
          r.type = 'radio';
          r.name = `q_${q.id}`;
          r.id = id;
          r.value = idx;
          l.appendChild(r);
          l.appendChild(document.createTextNode(' ' + c));
          choices.appendChild(l);
        });
        div.appendChild(choices);
        qDiv.appendChild(div);
      });
    } catch (err) {
      console.error('Error loading test:', err);
      alert('Error loading test. Check console and ensure /api/test is reachable.');
    }
  }

  function gatherAnswers() {
    const answers = {};
    document.querySelectorAll('.question').forEach(div => {
      const radios = div.querySelectorAll('input[type="radio"]');
      if (radios.length === 0) return;
      const nameAttr = radios[0].name; // q_<id>
      const id = nameAttr.split('_')[1];
      const checked = div.querySelector('input[type="radio"]:checked');
      if (checked) answers[id] = Number(checked.value);
    });
    return answers;
  }

  async function submitForm(e) {
    e.preventDefault();
    try {
      const nameEl = document.getElementById('name');
      const emailEl = document.getElementById('email');
      const name = nameEl && nameEl.value.trim();
      const email = emailEl && emailEl.value.trim();
      if (!name || !email) {
        alert('Please enter name and email.');
        return;
      }
      const answers = gatherAnswers();
      console.log('Submitting payload:', { name, email, answers });

      const res = await fetch('/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, answers }),
      });

      const text = await res.text(); // read as text first for better debug
      let data;
      try { data = JSON.parse(text); } catch (e) { data = { raw: text }; }

      if (!res.ok) {
        console.error('Server returned error:', res.status, data);
        alert('Submission failed: ' + (data.error || `${res.status} ${res.statusText}`));
        return;
      }

      console.log('Submission successful:', data);
      // show result area
      const form = document.getElementById('studentForm');
      const result = document.getElementById('result');
      if (form) form.classList.add('hidden');
      if (result) result.classList.remove('hidden');
      const scoreEl = document.getElementById('score');
      const detailsEl = document.getElementById('details');
      if (scoreEl) scoreEl.innerText = `Score: ${data.score} / ${data.total}`;
      if (detailsEl) detailsEl.innerText = `Correct answers: ` + JSON.stringify(data.correctAnswers || data.correct || {}, null, 2);
    } catch (err) {
      console.error('Error during submit:', err);
      alert('Submission error. Check console for details.');
    }
  }

  // attach handler safely after DOM loaded
  document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('studentForm');
    if (!form) {
      console.error('studentForm not found in DOM.');
      return;
    }
    form.addEventListener('submit', submitForm);
    loadTest();
  });
})();
