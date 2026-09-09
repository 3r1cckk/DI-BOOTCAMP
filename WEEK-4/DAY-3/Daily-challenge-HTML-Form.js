document.addEventListener('DOMContentLoaded', () => {
  const form = document.createElement('form');
  form.id = 'myForm';

  const nameLabel = document.createElement('label');
  nameLabel.textContent = 'Name: ';

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.id = 'name';
  nameInput.name = 'name';

  const nameBreak1 = document.createElement('br');
  const nameBreak2 = document.createElement('br');

  const lastNameLabel = document.createElement('label');
  lastNameLabel.textContent = 'Last Name: ';

  const lastNameInput = document.createElement('input');
  lastNameInput.type = 'text';
  lastNameInput.id = 'lastName';
  lastNameInput.name = 'lastName';

  const lastBreak1 = document.createElement('br');
  const lastBreak2 = document.createElement('br');

  const submitButton = document.createElement('button');
  submitButton.type = 'submit';
  submitButton.textContent = 'Send';

  nameLabel.appendChild(nameInput);
  lastNameLabel.appendChild(lastNameInput);

  form.appendChild(nameLabel);
  form.appendChild(nameBreak1);
  form.appendChild(nameBreak2);
  form.appendChild(lastNameLabel);
  form.appendChild(lastBreak1);
  form.appendChild(lastBreak2);
  form.appendChild(submitButton);

  document.body.appendChild(form);

  const output = document.createElement('div');
  output.id = 'output';
  document.body.appendChild(output);

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const lastName = document.getElementById('lastName').value;

    const data = {
      name: name,
      lastName: lastName,
    };

    const jsonString = JSON.stringify(data);

    const p = document.createElement('p');
    p.textContent = jsonString;
    output.appendChild(p);
  });
});