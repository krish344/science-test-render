async function loadTest() {
  const res = await fetch('/api/test');
  const data = await res.json();
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
}

document.getElementById('studentForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const answers = {};
  document.querySelectorAll('.question').forEach(div => {
    const qh = div.querySelector('h3').innerText;
    // find radio group name
    const radios = div.querySelectorAll('input[type="radio"]');
    if (radios.length === 0) return;
    const nameAttr = radios[0].name; // q_<id>
    const id = nameAttr.split('_')[1];
    const checked = div.querySelector('input[type="radio":checked];
    if (checked) answers[id] = Number(checked.value);
  });

  const payload = { name, email, answers };
  const res = await fetch('/api/results', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) {
    alert(data.error || 'Submission failed');
    return;
  }
  document.getElementById('studentForm').classList.add('hidden');
  document.getElementById('result').classList.remove('hidden');
  document.getElementById('score').innerText = `Score: ${data.score} / ${data.total}`;
  document.getElementById('details').innerText = `Correct answers: ` + JSON.stringify(data.correctAnswers, null, 2);
});

loadTest();