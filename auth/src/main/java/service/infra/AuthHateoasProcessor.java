package service.infra;

import org.springframework.hateoas.EntityModel;
import org.springframework.hateoas.Link;
import org.springframework.hateoas.server.RepresentationModelProcessor;
import org.springframework.stereotype.Component;
import service.domain.*;

@Component
public class AuthHateoasProcessor
    implements RepresentationModelProcessor<EntityModel<Auth>> {

    @Override
    public EntityModel<Auth> process(EntityModel<Auth> model) {
        return model;
    }
}
