describe('Formularz kontaktowy', () => {
  it('powinien wysłać wiadomość i pokazać potwierdzenie', () => {
    cy.visit('/');
    cy.get('a[href="#contact"]').click();
    cy.get('section#contact').should('be.visible');

    cy.get('input[name="name"]').type('Jan Testowy');
    cy.get('input[name="email"]').type('jan@test.pl');
    cy.get('textarea[name="message"]').type('Treść wiadomości testowej');

    cy.intercept('POST', '/api/contact', {
      statusCode: 200,
      body: { ok: true },
    }).as('sendMail');

    cy.contains('button', /Wyślij/i).click();
    cy.wait('@sendMail');
    cy.contains(/Wiadomość wysłana/i).should('be.visible');
    cy.get('input[name="email"]').should('have.value', '');
  });

  it('pokazuje błąd przy pustym formularzu', () => {
    cy.visit('/');
    cy.get('a[href="#contact"]').click();
    cy.contains('button', /Wyślij/i).click();
    cy.contains(/Uzupełnij wszystkie pola/i).should('be.visible');
  });
});
