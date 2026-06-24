INSTALACION_MD := instalacion/00-requisitos.md instalacion/10-variables-entorno.md instalacion/20-base-de-datos.md instalacion/30-backend.md instalacion/40-frontend.md instalacion/50-verificacion.md instalacion/99-problemas-comunes.md
USUARIO_MD := usuario/00-introduccion.md usuario/10-acceso-y-roles.md usuario/20-centro-y-catalogo.md usuario/30-clientes.md usuario/40-citas.md usuario/50-portal-cliente.md
REFERENCE_DOC := referencia.docx

.PHONY: all instalacion usuario clean

all: instalacion usuario

instalacion: Manual_Instalacion.docx

usuario: Manual_Usuario.docx

Manual_Instalacion.docx: $(INSTALACION_MD) $(REFERENCE_DOC)
	pandoc $(INSTALACION_MD) --reference-doc=$(REFERENCE_DOC) -o Manual_Instalacion.docx

Manual_Usuario.docx: $(USUARIO_MD) $(REFERENCE_DOC)
	pandoc $(USUARIO_MD) --reference-doc=$(REFERENCE_DOC) -o Manual_Usuario.docx

clean:
	rm -f Manual_Instalacion.docx Manual_Usuario.docx
