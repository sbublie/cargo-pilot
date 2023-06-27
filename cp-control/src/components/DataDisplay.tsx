import './display_style.css';
import Form from 'react-bootstrap/Form';

function DataDisplay() {
  

  
  return (
    <>
      <div className='custom-form'>
      <Form>
          <Form.Check
            type='switch'
            id='custom-switch'
            label='Show all empty tours'
            className='switch-label-left'

          />
          <Form.Check
            type='switch'
            label='Show matches'
            id='disabled-custom-switch'
            className='switch-label-left'

          />
        </Form>
    </div>
    </>
  );
}

export default DataDisplay;
