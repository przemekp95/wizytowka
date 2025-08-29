describe('Formularz kontaktowy', () => {
  it('powinien wysłać wiadomość i pokazać potwierdzenie', () => {
    cy.visit('/');

    // Klik w link "Kontakt" w nawigacji (unikamy innych linków do #contact)
    cy.get('a.nav-link[href="#contact"]').first().click();

    // Sekcja kontakt powinna być widoczna
    cy.get('section#contact').should('be.visible');

    // Wypełnij formularz
    cy.get('input[name="name"]').type('Jan Testowy');
    cy.get('input[name="email"]').type('jan@test.pl');
    cy.get('textarea[name="message"]').type('Treść wiadomości testowej');

    // Stub backendu
    cy.intercept('POST', '/api/contact', {
      statusCode: 200,
      body: { ok: true }
    }).as('sendMail');

    // Wyślij
    cy.contains('button', /Wyślij/i).click();

    // Oczekiwania
    cy.wait('@sendMail');
    cy.contains(/Wiadomość wysłana/i).should('be.visible');
    cy.get('input[name="email"]').should('have.value', '');
  });

  it('pokazuje błąd przy pustym formularzu', () => {
    cy.visit('/');

    // Klikamy dokładnie link w nav
    cy.get('a.nav-link[href="#contact"]').first().click();

    cy.contains('button', /Wyślij/i).click();
    cy.contains(/Uzupełnij wszystkie pola/i).should('be.visible');
  });
});
