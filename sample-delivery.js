
// A sample Torus activity component for delivery mode.

// This component's primary responsibilites include:
//
// 1. The display of the current model of this activity instance, the
//    state of which is passed to this component in the "model" atribute.
// 2. Handling submission of student's answer and the display of the
//    feedback received from the Torus server.  The submission of the
//    student's resposne is done by dispatching the "submitActivity" CustomEvent
//    A callback method fires with the results of the evaluation.

export class SampleActivityDelivery extends HTMLElement {

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

  // A helper method to provide access to the attributes that Torus provides
  // an activity component.  The 'model' represents the content of this
  // activity instance.  The 'state' represents the state of this current attempt.
  // 'graded' is a boolean indicating whether this activity is operating in
  // the context of a graded assessment. Activity implementations may wish
  // to change their submission behavior and handling of evaluations in a graded context.
  props() {
    const model = JSON.parse(this.getAttribute('model'));
    const graded = JSON.parse(this.getAttribute('graded'));
    const state = JSON.parse(this.getAttribute('state'));

    return {
      graded,
      model,
      state,
    };
  }

  // A helper method to render the activity content and to invoke activity submission.
  render(mountPoint, props) {

    mountPoint.innerHTML =
      '<div>' +
        '<p>' + props.model.stem + '</p>' +
        '<input type="number" id="' + props.state.attemptGuid + '">' +
        '<div><button id="submit" class="btn btn-primary">Submit</button></div>' +
      '</div>';

    const attemptGuid = props.state.attemptGuid;
    const partAttemptGuid = props.state.parts[0].attemptGuid;

    document.getElementById('submit').addEventListener('click', () => this.submit(attemptGuid, partAttemptGuid));
  }

  // Submitting an activity involves dispatching the 'submitActivity' CustomEvent with the
  // appropriate payload (the part attempt identifier and the student's response).  The 'continuation'
  // callback allows access to the async result of the server's evaluation.
  submit(attemptGuid, partAttemptGuid) {

    this.dispatchEvent(new CustomEvent(
      'submitActivity', {
        bubbles: true,
        detail: {
          payload: [ { attemptGuid: partAttemptGuid, response: { input: document.getElementById(attemptGuid).value }}],
          attemptGuid,
          continuation: (result, error) => {
            if (error) {
              console.log(error);
            } else {
              alert(result.evaluations[0].feedback.content);
            }
          },
        },
      },
    ));
  }

  // Here we instruct the web component to notify us when one of the 'observedAttributes' changes.
  // Given the lifecyle of attributes in WebComponent spec, this is necessary to allow a rendering
  // to occur with the attributes being present.
  attributeChangedCallback(name, oldValue, newValue) {
    if (this.connected) {
      this.render(this.mountPoint, this.props());
    }
  }

  static get observedAttributes() { return ['model', 'state']; }
}

// Register the web component
window.customElements.define('oli-sample-delivery', SampleActivityDelivery);
