import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Button from './components/Button';

// Prop types

interface detailPropTypes {
  id: string;
  name: string;
}

interface fieldPropType {
  name: string;
  type: string;
  label: string;
  description?: string;
  maxlength?: number;
  required: boolean;
  validation: any[];
  options?: string;
  error: string;
}

interface donationPropTypes {
  id: string;
  name: string;
  location: {
    [key: string]: any;
  };
  theme: {
    [key: string]: any;
  };
  reference: {
    [key: string]: any;
  };
  status: {
    [key: string]: any;
  };
  price: {
    [key: string]: any;
  };
}

// Set up the new donation form fields

const formFields: fieldPropType[] = [
  {
    name: 'name',
    type: 'text',
    label: 'Name',
    description: 'Must be between 1-200 characters',
    maxlength: 200,
    required: true,
    validation: [
      {
        type: 'regexp',
        test: /^.{1,200}$/
      }
    ],
    error: 'Your name must be between 1-200 characters'
  },
  {
    name: 'location',
    type: 'select',
    label: 'Location',
    options: 'locations',
    required: true,
    validation: [
      {
        type: 'options'
      }
    ],
    error: 'Please select a valid location'
  },
  {
    name: 'theme',
    type: 'select',
    label: 'Theme',
    options: 'themes',
    required: true,
    validation: [
      {
        type: 'options'
      }
    ],
    error: 'Please select a valid theme'
  },
  {
    name: 'price',
    type: 'text',
    label: 'Price (GBP)',
    required: false,
    validation: [
      {
        type: 'regexp',
        test: /^([0-9]*[1-9][0-9]*(\.[0-9]+)?|[0]+\.[0-9]*[1-9][0-9]*)$/
      }
    ],
    error: 'Amount must be above 0 (zero)'
  }
];

// Get the initial data (locations, statuses, themes)

function App() {
  const [loading, setLoadingValue] = useState(true);
  const [locations, setLocationsValue] = useState<detailPropTypes[]>([]);
  const [statuses, setStatusesValue] = useState<detailPropTypes[]>([]);
  const [themes, setThemesValue] = useState<detailPropTypes[]>([]);
  const [donations, setDonationsValue] = useState([]);
  const [modalValue, setModalValue] = useState(false);
  const [formData, setFormData] = useState<{[key: string]: any;}>({});
  const [formErrors, setFormErrorsValue] = useState<{[key: string]: any;}>({});
  const [filterStatus, setFilterStatus] = useState('all');

  // Get the donations from the api

  const getDonations = () => {
    axios.get(`${process.env.REACT_APP_API_BASE_URL}/v1/donationItems/all`)
      .then((response) => {
        setDonationsValue(response.data);
      });
  };

  // Filter donations by status

  const filteredDonations = () => {
    if (filterStatus === 'all') {
      return donations;
    }
    return donations.filter((item: donationPropTypes) => item.status.id === filterStatus);
  };

  // Handle form field input and attach to state

  const handleInput = (e: React.SyntheticEvent) => {
    const target = e.target as HTMLInputElement;
    setFormData((v) => {
      const newData = {...v};
      newData[target.name] = target.value;
      return newData;
    });
  };

  // Update the status to filter donations

  const updateStatus = (e: React.SyntheticEvent) => {
    const target = e.target as HTMLInputElement;
    setFilterStatus(target.value);
  };

  // Handle form submission to create new donation

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();

    // Variables

    let valid = true;
    let errorKeys: {[key: string]: any} = {};
    
    // Reset the form

    setFormErrorsValue(errorKeys);

    // Validate the form first

    for (let i in formFields) {
      let validField = true;
      if (formFields[i].name in formData) {
        for (let ii = 0; ii < formFields[i].validation.length; ii += 1) {
          if (formFields[i].validation[ii].type === 'options') {
            let optionsInvalid = false;
            if (formFields[i].options === 'themes') {
              if (themes.filter((item: {[key: string]: any}) => item.id === formData[formFields[i].name]).length === 0) {
                optionsInvalid = true;
              }
            } else if (formFields[i].options === 'locations') {
              if (locations.filter((item: {[key: string]: any}) => item.id === formData[formFields[i].name]).length === 0) {
                optionsInvalid = true;
              }
            }
            if (optionsInvalid) {
              validField = false;
            }
          } else if (formFields[i].validation[ii].type === 'regexp' && !formFields[i].validation[ii].test.test(formData[formFields[i].name])) {
            validField = false;
          }
        }
      } else {
        validField = false;
      }
      if (!validField) {
        valid = false;
        errorKeys[formFields[i].name] = formFields[i].error;
      }
    }

    // Check if the donation name is unique

    if (!('name' in errorKeys) && donations.filter((item: donationPropTypes) => item.name === formData.name).length > 0) {
      valid = false;
      errorKeys.name = 'This name is already being used';
    }

    // If valid then create the donation

    if (valid) {
      const newFormData = {...formData};
      const price = parseFloat(newFormData.price);
      newFormData.price = {
        currencyCode: 'GBP',
        amount: price
      };
      axios({
        url: `${process.env.REACT_APP_API_BASE_URL}/v1/donationItems`,
        method: 'post',
        data: newFormData
      })
        .then((response) => {
          getDonations();
          setModalValue(false);
        })
        .catch((e) => {
          errorKeys.default = 'We could not process your donation, please try again later';
          setFormErrorsValue(errorKeys);
        });
    } else {
      errorKeys.default = 'Please fill in all the fields correctly';
      setFormErrorsValue(errorKeys);
    }
  };

  // Load the initial data in

  useEffect(() => {
    const endpoints = [
      `${process.env.REACT_APP_API_BASE_URL}/v1/donationItems/locations`,
      `${process.env.REACT_APP_API_BASE_URL}/v1/donationItems/statuses`,
      `${process.env.REACT_APP_API_BASE_URL}/v1/donationItems/themes`
    ];
    axios.all(endpoints.map((endpoint) => axios.get(endpoint))).then(axios.spread((...responses) => {
      setLoadingValue(false);
      setLocationsValue(responses[0].data);
      setStatusesValue(responses[1].data);
      setThemesValue(responses[2].data);
    })).catch(e => {
      console.error(e);
    });
  }, []);

  // Get the donations

  useEffect(() => {
    if (!loading) {
      getDonations();
    }
  }, [loading]);

  return (
    <div className="app">
      {(loading) ? (
        <div className="app__loading" />
      ) : (
        <>
          <header className="app__header">
            <h1>
              <span>Donator</span>
              <span>n3o</span>
            </h1>
          </header>
          <main className="app__body">
            <div className="app__actions">
              <strong>{filteredDonations().length} rows</strong>
              <select onChange={updateStatus}>
                <option value="all">All</option>
                {statuses.map((status) => (
                  <option value={status.id} key={status.id}>{status.name}</option>
                ))}
              </select>
              <Button type="button" color="green" onClick={() => setModalValue(true)}>New</Button>
            </div>
            <ul className="app__list">
              {donations == null ? (
                <li className="is-loading">Loading...</li>
              ) : (
                <>
                  {(filteredDonations().length > 0 && filteredDonations().map((donation: donationPropTypes) => (
                    <li className="app__item" key={donation.name}>
                      <div>
                        <div>{donation.name}</div>
                        <small>Ref: {donation.reference.text}</small>
                      </div>
                      <div>{donation.location.name}</div>
                      <div>{donation.theme.name}</div>
                      <div className={`is-${donation.status.id}`}>{donation.status.name}</div>
                      <div>&pound;{donation.price.amount}</div>
                    </li>
                  ))) || (
                    <li className="is-none">No donations found</li>
                  )}
                </>
              )}
            </ul>
          </main>
          {modalValue &&
            <div className="app__modal">
              <form action="#" className="app__form" onSubmit={handleSubmit}>
                <button type="button" aria-label="Close" onClick={() => setModalValue(false)}>&times;</button>
                <h2>New donation</h2>
                {formFields.map((field) => (
                  <div key={field.name}>
                    {field.type === 'text' &&
                      <>
                        <label htmlFor={`field-${field.name}`}>{field.label}</label>
                        <input type="text" id={`field-${field.name}`} name={field.name} maxLength={field.maxlength} onInput={handleInput} />
                      </>
                    }
                    {field.type === 'select' &&
                      <>
                        <label htmlFor={`field-${field.name}`}>{field.label}</label>
                        <select id={`field-${field.name}`} name={field.name} onChange={handleInput}>
                          <option value="">Choose option</option>
                          {field.options === 'themes' && themes.map((theme) => (
                            <option value={theme.id} key={theme.id}>{theme.name}</option>
                          ))}
                          {field.options === 'locations' && locations.map((location) => (
                            <option value={location.id} key={location.id}>{location.name}</option>
                          ))}
                        </select>
                      </>
                    }
                    {field.name in formErrors &&
                      <p className="is-error"><small>{formErrors[field.name]}</small></p>
                    }
                  </div>
                ))}
                {'default' in formErrors &&
                  <div className="app__error">{formErrors.default}</div>
                }
                <Button type="submit" color="green">Submit</Button>
              </form>
            </div>
          }
        </>
      )}
    </div>
  );
}

export default App;
