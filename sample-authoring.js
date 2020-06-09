
// A sample Torus activity component for authoring mode.

// This component's primary responsibilites include:
//
// 1. The display of the current model of this activity instance, the
//    state of which is passed to this component in the "model" atribute.
// 2. Handling edits made by an author to the model and submitting those
//    changes to the Torus server. This submission is done via dispatching
//    of the "modelUpdated" CustomEvent. Torus client-side
//    code that wraps an authoring component will catch and handle this
//    event - incorporating this request to save into an undo/redo facility
//    as well as a deferred save mechanism to throttle save requests to the
//    server.


// An authoring entry point must also export the delivery component.  This is
// what allows the activity to be operated in a "test mode" inside the Torus
// page editor.
export { SampleActivityDelivery } from './sample-delivery';

class SampleActivityAuthoring extends HTMLElement {

  constructor() {
    super();
    this.mountPoint = document.createElement('div');
    this.connected = false;
  }

  // This is a standard web component method that indicates that the
  // component has been mounted in the DOM.
  connectedCallback() {
    this.appendChild(this.mountPoint);
    this.connected = true;

    this.render(this.mountPoint, this.props());
  }

  // Helper method to get the attributes passed down to the component.
  props() {
    const model = JSON.parse(this.getAttribute('model'));

    return {
      model,
    };
  }

  // Helper method to render an authoring view of this activity instance.
  render(mountPoint, props) {

    const rule = props.model.authoring.parts[0].responses[0].rule;
    const correct = rule.substring(rule.indexOf('{') + 1, rule.indexOf('}'));

    // Here we are simply rendering directly into the mount point. This is advantageous
    // for activities that wish to inherit the Torus defined CSS.  We could also
    // choose to render in the context of a shadow DOM to provide CSS insulation. Finally,
    // we could choose to simply render an iframe here, referencing a third-party
    // hosted page.  That page would have to directly use the Torus REST endpoints instead
    // of the Torus activity custom events - as events do not bubble up through an iframe
    // to the parent.

    mountPoint.innerHTML =
      '<div style="margin: 50px;">' +
        '<p>What question would you like to pose to the student?</p>' +
        '<input type="text" id="stem" value="' + props.model.stem + '">' +
        '<p>What is the correct answer?</p>' +
        '<input type="number" id="correct" value="' + correct + '">' +
        '<div><button class="btn btn-primary" id="save">Save Changes</button></div>' +
      '</div>';

    document.getElementById('save').addEventListener('click', () => this.submit());
  }

  // Helper method to save the current state of the activity instance, via a dispatch
  // of the "modelUpdated" CustomEvent.
  submit() {

    const stem = document.getElementById('stem').value;
    const correct = document.getElementById('correct').value;
    const model = buildModel(stem, correct);

    this.dispatchEvent(new CustomEvent(
      'modelUpdated', {
        bubbles: true,
        detail: {
          model,
          continuation: (result, error) => {
            if (error) {
              console.log(error);
            } else {
              console.log(result);
            }
          },
        },
      },
    ));
  }

  // Handle the changing of an attribute, which just re-renders our component
  attributeChangedCallback(name, oldValue, newValue) {

    if (this.connected) {
      this.render(this.mountPoint, this.props());
    }
  }

  // We instruct our web component to notify the implementation anytime a
  // new 'model' attribute is pushed down to the component. This is important
  // since the Torus client-side editor provides an undo/redo implementation around
  // our authoring component. Anytime an author clicks 'undo' a new model instance
  // representing a previous editing state will be pushed down
  static get observedAttributes() { return ['model']; }
}

// A helper function to create our full model from a stem and a correct answer.
// For the sake of simplification we just have canned "Correct" and "Incorrect"
// feedbacks and offer no hints.
function buildModel(stem, correct) {
  return {
    stem,
    authoring: {
      parts: [{
        "id": "1",
        "scoringStrategy": "average",
        "responses": [
          { "id": "response1", "rule": "input = {" + correct + "}", "score": 1, "feedback": {"id": "feedback1", "content": "Correct"}},
          { "id": "response2", "rule": "input like {.*}", "score": 0, "feedback": {"id": "feedback2", "content": "Incorrect"}}
        ],
        "hints": []
      }]
    }
  }
}

// Register the web component:
window.customElements.define('oli-sample-authoring', SampleActivityAuthoring);

// Register the default model creation function.  The Torus resource editor uses
// this registered function in order to create new instances of activities. Notice
// that this method returns a Promise.  This allows an activity to have a creation
// function that operates async (e.g. it could reach out to its own server to request
// a new model, using some aspect of the provided creation 'context')
function createFn(context) {
  return Promise.resolve(Object.assign({}, buildModel("What is two plus two?", 4)));
}

if (window.oliCreationFuncs === undefined) {
  window.oliCreationFuncs = {};
}

const manifest = require('./manifest.json');
window.oliCreationFuncs[manifest.id] = createFn;

