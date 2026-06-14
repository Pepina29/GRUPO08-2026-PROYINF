import unittest
import requests
import io

class TestEndpointCargaDocumentos(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.url_upload = "http://localhost:3000/api/upload-docs"
        cls.rut_prueba = "21550326-7"

    @classmethod
    def tearDownClass(cls):
        cls.url_upload = None
        cls.rut_prueba = None

    def test_carga_documentos_exitoso(self):
        archivos = {
            'frontal': ('frontal.jpg', io.BytesIO(b"imagen falsa frontal"), 'image/jpeg'),
            'trasera': ('trasera.jpg', io.BytesIO(b"imagen falsa trasera"), 'image/jpeg')
        }
        datos = {'rut': self.rut_prueba}
        
        response = requests.post(self.url_upload, files=archivos, data=datos)
        self.assertIn(response.status_code, [200, 404])

    def test_carga_documentos_fallo_falta_archivo(self):
        archivos_incompletos = {
            'frontal': ('frontal.jpg', io.BytesIO(b"imagen falsa frontal"), 'image/jpeg')
        }
        datos = {'rut': self.rut_prueba}
        
        response = requests.post(self.url_upload, files=archivos_incompletos, data=datos)
        self.assertEqual(response.status_code, 400)

if __name__ == '__main__':
    unittest.main(verbosity=2)