
function ListGroup() {
    const items = [
        'Mahlzeit',
        'Grüzi',
        'Hallo',
        'Moin'
    ];

    

    return (
        //this is a fragment
        <>  
          <h1>List</h1>
          <ul className="list-group">
            {items.map(item => <li className = "list-group-item" key={item}>{item}</li>)}
          </ul>
        </>
      );
}

export default ListGroup;