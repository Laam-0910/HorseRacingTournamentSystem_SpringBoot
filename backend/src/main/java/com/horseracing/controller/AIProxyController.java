package com.horseracing.backend.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

@RestController
@RequestMapping("/ai")
@CrossOrigin(origins = "*")
public class AIProxyController {

    private static final String AI_BASE_URL = "http://localhost:5000";
    private final RestTemplate restTemplate = new RestTemplate();

    @GetMapping("/**")
    public ResponseEntity<String> getProxy(HttpServletRequest request) {
        String path = request.getRequestURI().substring(request.getContextPath().length() + 3); // removes /ai prefix
        String url = AI_BASE_URL + path;
        if (request.getQueryString() != null) {
            url += "?" + request.getQueryString();
        }

        try {
            return restTemplate.getForEntity(url, String.class);
        } catch (HttpStatusCodeException e) {
            return ResponseEntity.status(e.getStatusCode())
                    .headers(e.getResponseHeaders())
                    .body(e.getResponseBodyAsString());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }

    @PostMapping("/**")
    public ResponseEntity<String> postProxy(@RequestBody(required = false) String body, HttpServletRequest request) {
        String path = request.getRequestURI().substring(request.getContextPath().length() + 3);
        String url = AI_BASE_URL + path;
        if (request.getQueryString() != null) {
            url += "?" + request.getQueryString();
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<String> entity = new HttpEntity<>(body, headers);

        try {
            return restTemplate.postForEntity(url, entity, String.class);
        } catch (HttpStatusCodeException e) {
            return ResponseEntity.status(e.getStatusCode())
                    .headers(e.getResponseHeaders())
                    .body(e.getResponseBodyAsString());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }
}
