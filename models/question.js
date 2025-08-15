const mongoose = require('mongoose');

const question = new mongoose.Schema({
  company: {
    type: String
  },
  qunname: {
    type: String
  },
  tag: {
    type: String
  },
  qunlink: {
    type: String
  },
  dif: {
    type: String
}
});

question.methods.renderCard = function (isSolved) {
  return `
    <div class="card mb-3 p-3 shadow">
      <h5 class="card-title">${this.qunname}</h5>
      <p class="card-text d-flex flex-wrap">
        <span class="me-2"><strong>Company:</strong> ${this.company}</span>
        <span class="me-2"><strong>Difficulty:</strong> ${this.dif}</span>
        <span><strong>Tag:</strong> ${this.tag}</span>
        <span class="me-2 ms-auto"><a href="${this.qunlink}" class="btn btn-primary" target="_blank">View</a></span>
      </p>
     <form class="toggle-solved-form">
      <input type="checkbox" name="solved" value="true" ${isSolved ? 'checked' : ''} onchange="this.form.dispatchEvent(new Event('submit', { cancelable: true }))">
      <input type="hidden" name="questionId" value="${this._id}">
    </form>

    </div>
  `;
};


module.exports = mongoose.model('question', question);
