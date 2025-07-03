// src/pages/Reservations/Contract/Contract.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import reservationService from '../../../services/reservationService';
import Loading from '../../../components/Loading/Loading';
import './Contract.css';

const Contract = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();

  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const apiBaseUrl = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    const fetchReservation = async () => {
      try {
        setLoading(true);
        const data = await reservationService.getById(id);
        console.log(data);
        setReservation(data);
      } catch (err) {
        console.error('❌ Error fetching reservation:', err);
        setError(t('reservation.contract.errorLoading'));
      } finally {
        setLoading(false);
      }
    };

    // Add a class to the body for print-specific styles
    document.body.classList.add('contract-print-page');

    if (id) {
      fetchReservation();
    }
    
    // Cleanup function to remove the class when component unmounts
    return () => {
      document.body.classList.remove('contract-print-page');
    };
  }, [id, t]);

  const handlePrint = () => {
          const contractEl = document.querySelector('.invoice-print');
          if (!contractEl) return;

          // 1. Open a blank print window
          const printWindow = window.open('', '_blank', 'width=800,height=600');
          if (!printWindow) return;

          // 2. Start the document
          printWindow.document.open();
          printWindow.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Contract</title>`);

          // 3. Clone all <link rel="stylesheet"> and <style> from the main document
          document.querySelectorAll('link[rel="stylesheet"], style').forEach(node => {
            printWindow.document.write(node.outerHTML);
          });

          // 4. Close head, open body, and inject your contract HTML
          printWindow.document.write(`</head><body>${contractEl.outerHTML}</body></html>`);
          printWindow.document.close();

          // 5. Give it a moment to render, then print & close
          printWindow.focus();
          setTimeout(() => {
            printWindow.print();
            printWindow.close();
          }, 200);
    };


  const handleBack = () => {
    navigate('/reservations');
  };

  // Calculate width based on number of customers
  const calculateWidths = () => {
    if (!reservation || !reservation.customer) return { widthSignature: 50, widthSignatureCustomer: 50 };
    
    // In a real implementation, you might have multiple customers
    // For now, assuming a single customer for simplicity
    const customersCount = 2; // 1 customer + agency
    const widthSignature = customersCount === 2 ? 50 : 40;
    const widthSignatureCustomer = customersCount === 2 ? 50 : (60 / (customersCount - 1));
    
    return { widthSignature, widthSignatureCustomer };
  };

  // Format date string to yyyy-MM-dd HH:mm
  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  // Format date string to yyyy-MM-dd
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="contract-error">
        <h2>{error}</h2>
        <button onClick={handleBack} className="btn-back">
          {t('common.back')}
        </button>
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="contract-error">
        <h2>{t('reservation.contract.notFound')}</h2>
        <button onClick={handleBack} className="btn-back">
          {t('common.back')}
        </button>
      </div>
    );
  }

  const { widthSignature, widthSignatureCustomer } = calculateWidths();
  const title = `${reservation.car?.licensePlate || ''} | ${reservation.customer?.fullName || ''}`;

  return (
    <>
      {/* Print control buttons - these will be hidden during print */}
      <div className="contract-actions no-print">
        <button onClick={handleBack} className="btn-back">
          {t('common.goBack')}
        </button>
        <button onClick={handlePrint} className="btn-print">
          {t('common.print')}
        </button>
      </div>

      {/* The actual printable contract */}
      <div className="invoice-print">
        {/* Header with logos and title */}
        <div className="row">
          <div className="col-4">
            <img src={apiBaseUrl + reservation.agency?.logoUrl} width="220" alt="Agency Logo" />
          </div>
          <div className="col-4">
            <h1 className="text-center">{reservation.agency?.name}</h1>
            <p className="text-center">Contrat de location</p>
          </div>
          <div className="col-4 logo-container">
            <img src={"/src/assets/contract/Flascam.png"} className="right-logo" alt="Flascam" />
          </div>
        </div>

        {/* Car details and dates */}
        <div className="row">
          <div className="col-6">
            <table className="table table-bordered">
              <tbody>
                <tr>
                  <td>Marque + Matricule</td>
                  <td className="text-center">
                    {reservation.car?.car_Model?.car_Manufacturer?.name || ''} | {reservation.car?.car_Model?.name || ''} | {reservation.car?.licensePlate || ''}
                  </td>
                  <td dir="rtl">الماركة + رقم تسجيل السيارة</td>
                </tr>
                <tr>
                  <td>Lieu de livraison</td>
                  <td className="text-center">{reservation.pickupLocation || ''}</td>
                  <td dir="rtl">مكان التسليم</td>
                </tr>
                <tr>
                  <td>Lieu de reprise</td>
                  <td className="text-center">{reservation.dropoffLocation || ''}</td>
                  <td dir="rtl">مكان الاستلام</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="col-6">
            <table className="table table-bordered">
              <tbody>
                <tr>
                  <td>Date et heure de livraison</td>
                  <td className="text-center">{formatDateTime(reservation.startDate)}</td>
                  <td dir="rtl">تاريخ ووقت التسليم</td>
                </tr>
                <tr>
                  <td>Date et heure de réception</td>
                  <td className="text-center">{formatDateTime(reservation.endDate)}</td>
                  <td dir="rtl">تاريخ ووقت الاستلام</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Pricing and document details */}
        <div className="row mb-1">
          <table className="table table-bordered text-center">
            <tbody>
              <tr>
                <td>Prix par jour</td>
                <td>Nombre des jours</td>
                <td>Total</td>
                <td>Reste</td>
                <td>KM de depart</td>
                <td>KM d'arriver</td>
              </tr>
              <tr style={{ height: '25px' }}>
                <td>{reservation.agreedPrice}</td>
                <td></td>
                <td>{reservation.finalPrice || reservation.agreedPrice}</td>
                <td></td>
                <td>{reservation.odometerStart || ''}</td>
                <td>{reservation.odometerEnd || ''}</td>
              </tr>
            </tbody>
          </table>
          
          <table className="table table-bordered mb-2 text-center">
            <tbody>
              <tr>
                <td>Carte grise <input type="checkbox" className="ml-4" /></td>
                <td>Assurance <input type="checkbox" className="ml-4" /></td>
                <td>Vignette <input type="checkbox" className="ml-4" /></td>
                <td>Visite Technique <input type="checkbox" className="ml-4" /></td>
                <td>Autorisation <input type="checkbox" className="ml-4" /></td>
                <td>Contrat <input type="checkbox" className="ml-4" /></td>
                <td>Pisrina <input type="checkbox" className="ml-4" /></td>
              </tr>
            </tbody>
          </table>

          {/* Customer details */}
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th></th>
                  {reservation.customers.map((_, idx) => (
                    <th key={idx} className="text-center">Chauffeur {idx + 1}</th>
                  ))}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'Nom',      key: 'fullName',    rtl: 'اسم العائلة',    format: v => v?.toUpperCase() },
                  { label: 'Prénom',   key: 'firstName',   rtl: 'الاسم الشخصي',  format: v => v?.toUpperCase() },
                  { label: 'Date de naissance', key: 'dateOfBirth', rtl: 'تاريخ الولادة', format: formatDate },
                  { label: 'Adresse',   key: 'address',     rtl: 'العنوان',        format: v => v },
                  { label: 'Téléphone', key: 'phone',       rtl: 'رقم الهاتف',     format: v => v },
                ].map(({ label, key, rtl, format }) => (
                  <tr key={key}>
                    <td>{label}</td>
                    {reservation.customers.map((c, i) => (
                      <td key={i} className="text-center">
                        <b>{format(c[key]) || ''}</b>
                      </td>
                    ))}
                    <td dir="rtl">{rtl}</td>
                  </tr>
                ))}

                {/* Permit fields */}
                {reservation.customers.some(c => c.permitNumber) && (
                  <>
                    {[
                      { label: 'Numéro du permit', key: 'permitNumber', rtl: 'رقم رخصة القيادة', format: v => v },
                      { label: "Date d'expiration", key: 'permitDate',   rtl: 'تاريخ انتهاء الرخصة', format: formatDate },
                    ].map(({ label, key, rtl, format }) => (
                      <tr key={key}>
                        <td>{label}</td>
                        {reservation.customers.map((c, i) => (
                          <td key={i} className="text-center">
                            <b>{format(c[key]) || ''}</b>
                          </td>
                        ))}
                        <td dir="rtl">{rtl}</td>
                      </tr>
                    ))}
                  </>
                )}

                {/* C.I.N fields */}
                {reservation.customers.some(c => c.cin) && (
                  <>
                    {[
                      { label: 'C.I.N', key: 'cin', rtl: 'رقم البطاقة الوطنية', format: v => v },
                      { label: "Date d'expiration C.I.N", key: 'cinDate', rtl: 'تاريخ انتهاء صلاحية C.I.N', format: formatDate },
                    ].map(({ label, key, rtl, format }) => (
                      <tr key={key}>
                        <td>{label}</td>
                        {reservation.customers.map((c, i) => (
                          <td key={i} className="text-center">
                            <b>{format(c[key]) || ''}</b>
                          </td>
                        ))}
                        <td dir="rtl">{rtl}</td>
                      </tr>
                    ))}
                  </>
                )}

                {/* Passport fields */}
                {reservation.customers.some(c => c.passport) && (
                  <>
                    {[
                      { label: 'Passport', key: 'passport', rtl: 'جواز السفر', format: v => v },
                      { label: 'Délivré le', key: 'passportDate', rtl: 'تم التسليم في التاريخ', format: formatDate },
                    ].map(({ label, key, rtl, format }) => (
                      <tr key={key}>
                        <td>{label}</td>
                        {reservation.customers.map((c, i) => (
                          <td key={i} className="text-center">
                            <b>{format(c[key]) || ''}</b>
                          </td>
                        ))}
                        <td dir="rtl">{rtl}</td>
                      </tr>
                    ))}
                  </>
                )}
              </tbody>
            </table>

        </div>

        {/* Car condition before and after */}
        <div className="row mb-1">
          <table className="table table-bordered text-center">
            <thead>
              <tr>
                <th style={{ width: '30%' }}>Etat avant</th>
                <th>Remarques</th>
                <th style={{ width: '30%' }}>Etat apres</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <img src={"/src/assets/contract/carAgreement.png"} alt="Car Before" className="car-image" />
                </td>
                <td className="remarks-cell">
                  <p className="text-center remarks-lines">
                    ________________________________________
                    ________________________________________
                    ________________________________________
                    ________________________________________
                    ________________________________________
                    ________________________________________
                    ________________________________________
                    ________________________________________
                    ________________________________________
                  </p>
                  <img src={"/src/assets/contract/Fuel.png"} className="fuel-image" alt="Fuel" />
                </td>
                <td>
                  <img src={"/src/assets/contract/carAgreement.png"} alt="Car After" className="car-image" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Terms and signatures */}
        <div className="row">
          <div className="col-8">
            <table className="table table-bordered">
              <tbody>
                <tr>
                  <td>
                    {reservation.agency?.conditions && (
                      <div dangerouslySetInnerHTML={{ __html: reservation.agency.conditions.replace(/\n/g, '<br/>') }} />
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
            <table className="table table-bordered text-center">
              <tbody>
                <tr>
                  <td style={{ width: `${widthSignature}%` }}>
                    {reservation.agency?.name}
                  </td>
                  <td style={{ width: `${widthSignatureCustomer}%` }}>
                    {reservation.customer?.fullName}
                  </td>
                </tr>
                <tr style={{ height: '80px' }}>
                  <td></td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="col-4">
            <table className="table table-bordered text-center">
              <tbody>
                <tr>
                  <td>
                    <div className="row">
                      <div className="col-6">Prolongation jusqu'a</div>
                      <div className="col-6">التمديد الى غاية</div>
                    </div>
                    <p>__________________</p>
                  </td>
                </tr>
                <tr style={{ height: '100px' }}>
                  <td className="signature-cell">
                    <p>Signature et cache</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer with agency contacts */}
        <div className="row">
          <table className="table table-bordered text-center">
            <tbody>
              <tr>
                <td>
                  {reservation.agency?.address}
                  <br />
                  Telephone : {reservation.agency?.phone} | E-mail : {reservation.agency?.email}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default Contract;